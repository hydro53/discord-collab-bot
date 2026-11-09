async function findOrCreateCommunity(pool, guildId, name) {
  const trimmed = name.trim();
  const { rows: existing } = await pool.query(
    `SELECT * FROM communities WHERE guild_id = $1 AND LOWER(name) = LOWER($2)`,
    [guildId, trimmed]
  );
  if (existing.length) return existing[0];

  const { rows: created } = await pool.query(
    `INSERT INTO communities (guild_id, name) VALUES ($1, $2) RETURNING *`,
    [guildId, trimmed]
  );
  return created[0];
}

module.exports = { findOrCreateCommunity };
