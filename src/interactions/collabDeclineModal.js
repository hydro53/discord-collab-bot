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
         RETURNING requester_guild_id, target_guild_id`,
        [collabId, reason]
      );

      if (res.rows.length === 0) {
        return interaction.editReply({ content: 'This request is no longer pending.' });
      }

      const { requester_guild_id, target_guild_id } = res.rows[0];
      const msg = `Collab #${collabId} was declined${reason ? ': ' + reason : ''}.`;

      await notifyGuild(interaction.client, requester_guild_id, msg);
      await notifyGuild(interaction.client, target_guild_id, msg);

      await interaction.editReply({ content: `Collab #${collabId} declined.` });
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