const pool = require('../db/pool');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  modal: {
    customId: 'collabDeclineModal',
    async execute(interaction) {
      await interaction.deferReply({ flags: 64 });

      const collabId = interaction.customId.split(':')[1];
      const reason = interaction.fields.getTextInputValue('reason') || null;

      const res = await pool.query(
        `UPDATE collabs SET status = 'declined', reason = $2, updated_at = NOW()
         WHERE id = $1 AND status = 'pending'
         RETURNING requester_guild_id, target_guild_id, request_message_id, request_channel_id`,
        [collabId, reason]
      );

      if (res.rows.length === 0) {
        return interaction.editReply({ content: 'This request is no longer pending.' });
      }

      const row = res.rows[0];

      // Edit original request message
      if (row.request_channel_id && row.request_message_id) {
        const channel = await interaction.client.channels.fetch(row.request_channel_id).catch(() => null);
        if (channel) {
          const msg = await channel.messages.fetch(row.request_message_id).catch(() => null);
          if (msg) {
            const embed = EmbedBuilder.from(msg.embeds[0] || {})
              .setTitle('❌ COLLAB DECLINED')
              .setColor(0xED4245)
              .setDescription(reason ? `Reason: ${reason}` : 'Declined.')
              .setFooter({ text: `Request #${collabId}` });
            await msg.edit({ embeds: [embed], components: [] }).catch(() => {});
          }
        }
      }

      const msgRequester = `❌ **COLLAB REQUEST DECLINED**\n\nRequest **#${collabId}** was declined${reason ? `.\nReason: ${reason}` : '.'}`;
      await notifyGuild(interaction.client, row.requester_guild_id, msgRequester);

      await interaction.editReply({ content: `Collab #${collabId} declined. Community notified.` });
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