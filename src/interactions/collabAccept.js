const pool = require('../db/pool');
const { requireTier, TIER_COLLAB_MANAGER } = require('../utils/permissions');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  button: {
    customId: 'collabAccept',
    async execute(interaction) {
      // Permission check before defer
      if (!(await requireTier(interaction, TIER_COLLAB_MANAGER))) return;

      await interaction.deferUpdate();

      const collabId = interaction.customId.split(':')[1];
      const res = await pool.query(
        `UPDATE collabs SET status = 'accepted', updated_at = NOW()
         WHERE id = $1 AND status = 'pending'
         RETURNING requester_guild_id, target_guild_id`,
        [collabId]
      );

      if (res.rows.length === 0) {
        return interaction.followUp({ content: 'This request is no longer pending.', flags: 64 });
      }

      const { requester_guild_id, target_guild_id } = res.rows[0];

      // Notify both servers
      await notifyGuild(interaction.client, requester_guild_id, `Collab #${collabId} was accepted by the target server.`);
      await notifyGuild(interaction.client, target_guild_id, `Collab #${collabId} accepted.`);

      await interaction.followUp({ content: `Collab #${collabId} accepted.`, flags: 64 });
    }
  }
};

async function notifyGuild(client, guildId, message) {
  const channelRes = await pool.query(
    `SELECT channel_id FROM guild_channels WHERE guild_id = $1 AND purpose = 'notifications'`,
    [guildId]
  );
  if (channelRes.rows.length === 0) return;
  const channel = await client.channels.fetch(channelRes.rows[0].channel_id).catch(() => null);
  if (channel) {
    await channel.send({ embeds: [new EmbedBuilder().setDescription(message)] }).catch(() => {});
  }
}