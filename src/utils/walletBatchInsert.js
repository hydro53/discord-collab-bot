const pool = require('../db/pool');

async function batchInsertWallets(allocationId, guildId, wallets) {
  if (!wallets || wallets.length === 0) return 0;

  const values = [];
  const placeholders = [];
  let i = 1;
  for (const w of wallets) {
    placeholders.push(`($${i++}, $${i++}, $${i++}, $${i++})`);
    values.push(allocationId, guildId, w.wallet, w.chain || 'evm');
  }

  const query = `
    INSERT INTO winners (allocation_id, guild_id, wallet, chain)
    VALUES ${placeholders.join(', ')}
    ON CONFLICT DO NOTHING
    RETURNING id
  `;

  // Note: schema doesn't have unique on (allocation_id, wallet) yet; add if needed
  const res = await pool.query(query, values);
  return res.rowCount;
}

module.exports = { batchInsertWallets };
