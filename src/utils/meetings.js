const { EmbedBuilder } = require('discord.js');
const { truncateText, truncateLines } = require('./formatList');

function formatRsvpList(userIds) {
  if (!userIds.length) return '—';
  return truncateLines(
    userIds.map((u) => `<@${u}>`),
    30 // keeps well under the 1024-char field limit even with long mention strings
  );
}

function buildRsvpEmbed(meeting, rsvpsByStatus) {
  const going = rsvpsByStatus.going || [];
  const cantMakeIt = rsvpsByStatus.cant_make_it || [];
  const suggestOther = rsvpsByStatus.suggest_other || [];

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`📅 ${truncateText(meeting.title, 200)}`)
    .addFields(
      { name: 'When', value: meeting.scheduled_at || '—', inline: true },
      { name: 'Link', value: meeting.meeting_link || '—', inline: true },
      { name: 'Collab', value: meeting.collab_id ? `#${meeting.collab_id}` : '—', inline: true },
      { name: `✅ Going (${going.length})`, value: formatRsvpList(going), inline: true },
      { name: `❌ Can't Make It (${cantMakeIt.length})`, value: formatRsvpList(cantMakeIt), inline: true },
      { name: `⏰ Suggested Other Time (${suggestOther.length})`, value: formatRsvpList(suggestOther), inline: true }
    )
    .setFooter({ text: `Meeting #${meeting.id}` });

  if (meeting.notes) embed.setDescription(truncateText(meeting.notes, 3500));

  return embed;
}

module.exports = { buildRsvpEmbed };
