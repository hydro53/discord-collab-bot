const pool = require('../db/pool');

/**
 * Access tiers:
 * - View: either server in a collab
 * - Submit (raffle, winners, meetings): either server
 * - Manage: the owning server only (the one that accepted)
 */
async function getCollabOwnership(collabId) {
  const res = await pool.query(
    'SELECT requester_guild_id, target_guild_id, status FROM collabs WHERE id = $1',
    [collabId]
  );
  if (res.rows.length === 0) return null;
  const { requester_guild_id, target_guild_id, status } = res.rows[0];
  // Owning server is the one that accepted (target, typically)
  const owner = status === 'accepted' || status === 'active' ? target_guild_id : requester_guild_id;
  return { requester: requester_guild_id, target: target_guild_id, owner, status };
}

async function canView(collabId, guildId) {
  const own = await getCollabOwnership(collabId);
  if (!own) return false;
  return own.requester === guildId || own.target === guildId;
}

async function canSubmit(collabId, guildId) {
  return canView(collabId, guildId);
}

async function canManage(collabId, guildId) {
  const own = await getCollabOwnership(collabId);
  if (!own) return false;
  return own.owner === guildId;
}

module.exports = { getCollabOwnership, canView, canSubmit, canManage };
