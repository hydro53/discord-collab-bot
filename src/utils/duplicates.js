const pool = require('../db/pool');

// EVM addresses are case-insensitive (checksum casing is cosmetic), so we
// normalize those to lowercase for comparison. Solana addresses are
// case-sensitive base58, so they're compared as-is.
function normalizeAddress(address) {
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) return address.toLowerCase();
  return address;
}

async function detectAndFlagDuplicates(collabId) {
  const { rows } = await pool.query(`SELECT id, wallet_address FROM wallets WHERE collab_id = $1`, [collabId]);

  const groups = new Map();
  for (const row of rows) {
    const key = normalizeAddress(row.wallet_address);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row.id);
  }

  const duplicateIds = [];
  const nonDuplicateIds = [];
  let duplicateGroupCount = 0;
  for (const ids of groups.values()) {
    if (ids.length > 1) {
      duplicateIds.push(...ids);
      duplicateGroupCount++;
    } else {
      nonDuplicateIds.push(...ids);
    }
  }

  // Recompute fully each run rather than only ever adding flags, so a wallet
  // that's no longer a duplicate (e.g. a bad entry was corrected) clears too.
  if (duplicateIds.length) {
    await pool.query(`UPDATE wallets SET is_duplicate = TRUE WHERE id = ANY($1::int[])`, [duplicateIds]);
  }
  if (nonDuplicateIds.length) {
    await pool.query(`UPDATE wallets SET is_duplicate = FALSE WHERE id = ANY($1::int[])`, [nonDuplicateIds]);
  }

  return { duplicateWalletCount: duplicateIds.length, duplicateGroupCount };
}

async function getDuplicateDetails(collabId, limit = 10) {
  const { rows } = await pool.query(
    `SELECT w.wallet_address, c.name AS community
     FROM wallets w LEFT JOIN communities c ON c.id = w.community_id
     WHERE w.collab_id = $1 AND w.is_duplicate = TRUE`,
    [collabId]
  );

  const groups = new Map();
  for (const row of rows) {
    const key = normalizeAddress(row.wallet_address);
    if (!groups.has(key)) groups.set(key, { address: row.wallet_address, communities: [] });
    groups.get(key).communities.push(row.community || 'Unknown');
  }

  return [...groups.values()].slice(0, limit);
}

module.exports = { detectAndFlagDuplicates, getDuplicateDetails, normalizeAddress };
