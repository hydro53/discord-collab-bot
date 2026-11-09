const { AttachmentBuilder } = require('discord.js');
const pool = require('../db/pool');

async function queryWalletRows(collabId, filter) {
  let where = 'w.collab_id = $1';
  if (filter === 'clean') where += ' AND w.is_duplicate = FALSE AND w.sybil_flag = FALSE AND w.is_valid_format = TRUE';
  if (filter === 'flagged') where += ' AND w.sybil_flag = TRUE';

  const { rows } = await pool.query(
    `SELECT w.wallet_address, c.name AS community, w.discord_username, w.x_handle,
            w.allocation, w.raffle_link, w.winner_source, w.sybil_flag, w.sybil_reasons,
            w.is_duplicate, w.is_valid_format, w.chain
     FROM wallets w
     LEFT JOIN communities c ON c.id = w.community_id
     WHERE ${where}
     ORDER BY c.name, w.wallet_address`,
    [collabId]
  );
  return rows;
}

function rowsToCsv(rows) {
  const header =
    'wallet,community,discord,x_handle,allocation,raffle_link,winner_source,sybil_flag,sybil_reasons,duplicate,valid_format,chain';

  // CSV injection guard: a cell starting with =, +, -, or @ can be
  // interpreted as a formula by Excel/Sheets when the file is opened.
  // Prefixing with a single quote neutralizes it while keeping the value visible.
  const sanitize = (v) => {
    if (v == null) return '';
    const s = String(v);
    return /^[=+\-@]/.test(s) ? `'${s}` : s;
  };
  const escape = (v) => `"${sanitize(v).replace(/"/g, '""')}"`;

  const lines = rows.map((r) =>
    [
      r.wallet_address,
      r.community,
      r.discord_username,
      r.x_handle,
      r.allocation,
      r.raffle_link,
      r.winner_source,
      r.sybil_flag,
      r.sybil_reasons,
      r.is_duplicate,
      r.is_valid_format,
      r.chain,
    ]
      .map(escape)
      .join(',')
  );
  return [header, ...lines].join('\n');
}

async function buildCsvAttachment(collab, filter = 'all') {
  const rows = await queryWalletRows(collab.id, filter);
  if (!rows.length) return null;

  const csvContent = rowsToCsv(rows);
  const filenameSafe = collab.project_name.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  const suffix = filter === 'clean' ? '_clean' : filter === 'flagged' ? '_flagged' : '';
  const attachment = new AttachmentBuilder(Buffer.from(csvContent, 'utf8'), {
    name: `${filenameSafe}_winners${suffix}.csv`,
  });

  return { attachment, count: rows.length };
}

module.exports = {
  buildWinnersCsvAttachment: (collab) => buildCsvAttachment(collab, 'all'),
  buildCleanWinnersCsvAttachment: (collab) => buildCsvAttachment(collab, 'clean'),
  buildFlaggedCsvAttachment: (collab) => buildCsvAttachment(collab, 'flagged'),
};
