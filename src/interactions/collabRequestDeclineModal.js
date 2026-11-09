const { EmbedBuilder } = require('discord.js');
const pool = require('../db/pool');
const { logAction } = require('../utils/auditLog');
const { resolveChannel } = require('../utils/guildChannels');

async function handleCollabRequestDeclineModal(interaction) {
  const [, requestId] = interaction.customId.split(':');
  const reason = interaction.fields.getTextInputValue('reason');

  // Same reasoning as the accept path — several DB calls happen before we
  // can respond, so defer immediately to avoid the 3s window expiring.
  await interaction.deferUpdate();

  const { rows } = await pool.query(`SELECT * FROM collab_requests WHERE id = $1`, [requestId]);
  if (!rows.length) {
    await interaction.followUp({ content: '❌ This request no longer exists.', ephemeral: true });
    return;
  }
  const request = rows[0];

  if (request.status !== 'pending') {
    await interaction.followUp({ content: `This request was already **${request.status}**.`, ephemeral: true });
    return;
  }

  await pool.query(
    `UPDATE collab_requests SET status = 'declined', decline_reason = $1, responded_by_id = $2, responded_by_tag = $3, responded_at = now() WHERE id = $4`,
    [reason || null, interaction.user.id, interaction.user.tag, requestId]
  );

  await logAction(interaction, 'collab_request_declined', reason || '(no reason given)');

  const { rows: receivingProfileRows } = await pool.query(`SELECT name FROM server_profiles WHERE guild_id = $1`, [
    request.receiving_guild_id,
  ]);
  const receivingName = receivingProfileRows[0]?.name || 'This server';

  const declinedEmbed = new EmbedBuilder()
    .setColor(0xed4245)
    .setTitle('❌ COLLAB DECLINED')
    .setDescription(`Declined by <@${interaction.user.id}>${reason ? `\n\nReason: ${reason}` : ''}`);
  await interaction.editReply({ embeds: [declinedEmbed], components: [] });

  const notifyChannelId = await resolveChannel(request.requesting_guild_id, 'notifications', request.requesting_channel_id);
  if (notifyChannelId) {
    const requesterChannel = await interaction.client.channels.fetch(notifyChannelId).catch(() => null);
    if (requesterChannel) {
      const notifyEmbed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('❌ Collab Request Declined')
        .setDescription(`**${receivingName}** declined your collaboration request.${reason ? `\n\nReason: ${reason}` : ''}`);
      await requesterChannel.send({ embeds: [notifyEmbed] }).catch(() => {});
    }
  }
}

module.exports = { handleCollabRequestDeclineModal };
