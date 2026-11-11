const pool = require('../db/pool');
const { requireTier, TIER_COLLAB_MANAGER } = require('../utils/permissions');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  button: {
    customId: 'collabAccept',
    async execute(interaction) {
      if (!(await requireTier(interaction, TIER_COLLAB_MANAGER))) return;

      await interaction.deferUpdate();

      const collabId = interaction.customId.split(':')[1];
      const res = await pool.query(
        `UPDATE collabs SET status = 'accepted', updated_at = NOW()
         WHERE id = $1 AND status = 'pending'
         RETURNING requester_guild_id, target_guild_id, request_message_id, request_channel_id`,
        [collabId]
      );

      if (res.rows.length === 0) {
        return interaction.followUp({ content: 'This request is no longer pending.', flags: 64 });
      }

      const row = res.rows[0];

      // Edit the original request message in place
      if (row.request_channel_id && row.request_message_id) {
        const channel = await interaction.client.channels.fetch(row.request_channel_id).catch(() => null);
        if (channel) {
          const msg = await channel.messages.fetch(row.request_message_id).catch(() => null);
          if (msg) {
            const embed = EmbedBuilder.from(msg.embeds[0] || {})
              .setTitle('🤝 COLLAB CONFIRMED')
              .setColor(0x57F287)
              .setDescription(`Collab **#${collabId}** is now active.`)
              .setFooter({ text: `Collab ID: ${collabId}` });
            await msg.edit({ embeds: [embed], components: [] }).catch(() => {});
          }
        }
      }

      // Notify requesting community
      await notifyGuild(
        interaction.client,
        row.requester_guild_id,
        `🎉 **COLLAB ACCEPTED**\n\nYour request has been approved.\n**Collab ID: #${collabId}**\nThe collab is now active.`
      );

      await interaction.followUp({ content: `Collab #${collabId} confirmed. Community notified.`, flags: 64 });
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
    await channel.send({ embeds: [new EmbedBuilder().setDescription(message).setColor(0x57F287)] }).catch(() => {});
  }
}