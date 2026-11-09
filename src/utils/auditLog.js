const pool = require('../db/pool');
const { getChannelId } = require('./guildChannels');

async function logAction(interaction, action, details = null, collabId = null) {
  try {
    await pool.query(
      `INSERT INTO audit_log (guild_id, actor_id, actor_tag, action, details, collab_id) VALUES ($1,$2,$3,$4,$5,$6)`,
      [interaction.guildId, interaction.user.id, interaction.user.tag, action, details, collabId]
    );
  } catch (err) {
    console.error('Failed to write audit log entry:', err);
    return; // don't attempt to mirror a write that didn't happen
  }

  // Best-effort mirror to a dedicated audit log channel, if configured.
  // Never lets a channel-posting failure affect the actual logged action.
  try {
    const channelId = await getChannelId(interaction.guildId, 'audit_log');
    if (!channelId) return;
    const channel = await interaction.client.channels.fetch(channelId).catch(() => null);
    if (!channel) return;
    const line = `📜 **${interaction.user.tag}** — ${action}${collabId ? ` (collab #${collabId})` : ''}${details ? `: ${details}` : ''}`;
    await channel.send(line).catch(() => {});
  } catch (err) {
    console.error('Failed to mirror audit log entry to channel:', err);
  }
}

module.exports = { logAction };
