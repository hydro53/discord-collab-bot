const pool = require('../db/pool');

const PURPOSES = {
  requests: { label: 'Incoming Collab Requests', emoji: '📥' },
  notifications: { label: 'Collab Notifications', emoji: '🤝' },
  reminders: { label: 'Reminders', emoji: '⏰' },
  audit_log: { label: 'Audit Log', emoji: '📜' },
};

async function getChannelId(guildId, purpose) {
  const { rows } = await pool.query(`SELECT channel_id FROM guild_channels WHERE guild_id = $1 AND purpose = $2`, [
    guildId,
    purpose,
  ]);
  return rows[0]?.channel_id || null;
}

async function setChannelId(guildId, purpose, channelId) {
  await pool.query(
    `INSERT INTO guild_channels (guild_id, purpose, channel_id, updated_at) VALUES ($1,$2,$3,now())
     ON CONFLICT (guild_id, purpose) DO UPDATE SET channel_id = EXCLUDED.channel_id, updated_at = now()`,
    [guildId, purpose, channelId]
  );
}

async function getAllChannels(guildId) {
  const { rows } = await pool.query(`SELECT purpose, channel_id FROM guild_channels WHERE guild_id = $1`, [guildId]);
  return rows;
}

// 'requests' has a legacy fallback: servers configured before this feature
// existed have their channel in server_profiles.request_channel_id rather
// than guild_channels. New configuration always goes through guild_channels.
async function getRequestsChannelId(guildId) {
  const direct = await getChannelId(guildId, 'requests');
  if (direct) return direct;
  const { rows } = await pool.query(`SELECT request_channel_id FROM server_profiles WHERE guild_id = $1`, [guildId]);
  return rows[0]?.request_channel_id || null;
}

// Falls back to a provided default channel (e.g. wherever the relevant
// action originally happened) when no dedicated channel is configured.
async function resolveChannel(guildId, purpose, fallbackChannelId = null) {
  const configured = await getChannelId(guildId, purpose);
  return configured || fallbackChannelId;
}

module.exports = { PURPOSES, getChannelId, setChannelId, getAllChannels, getRequestsChannelId, resolveChannel };
