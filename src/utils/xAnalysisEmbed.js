const { EmbedBuilder } = require('discord.js');

function formatAccountAge(createdAt) {
  if (!createdAt) return 'Unavailable';
  const days = Math.floor((Date.now() - createdAt.getTime()) / 86400000);
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  if (years > 0) return `${years}y ${months}m`;
  if (months > 0) return `${months}mo`;
  return `${days}d`;
}

function buildXAnalysisEmbed(handle, data) {
  const embed = new EmbedBuilder().setColor(0x1d9bf0).setTitle(`🔎 X ANALYSIS — @${handle}`);

  if (data.followers == null) {
    embed.setDescription('⚠️ Could not retrieve data for this handle.');
    return embed;
  }

  embed.addFields(
    { name: 'Followers', value: data.followers.toLocaleString(), inline: true },
    { name: 'Total Posts', value: data.tweetCount != null ? data.tweetCount.toLocaleString() : 'Unavailable', inline: true },
    { name: 'Account Age', value: formatAccountAge(data.accountCreatedAt), inline: true },
    { name: 'Posts (last 7 days, sampled)', value: `${data.postsLast7Days}`, inline: true },
    { name: 'Avg Likes', value: data.avgLikes != null ? data.avgLikes.toFixed(1) : 'Unavailable', inline: true },
    { name: 'Avg Replies', value: data.avgReplies != null ? data.avgReplies.toFixed(1) : 'Unavailable', inline: true },
    { name: 'Avg Reposts', value: data.avgReposts != null ? data.avgReposts.toFixed(1) : 'Unavailable', inline: true },
    { name: 'Avg Views', value: data.avgViews != null ? Math.round(data.avgViews).toLocaleString() : 'Unavailable', inline: true },
    { name: 'Engagement Rate', value: data.engagementRate != null ? `${data.engagementRate.toFixed(2)}%` : 'Unavailable', inline: true }
  );

  embed.setFooter({
    text: `Based on the ${data.sampleSize} most recent original posts${data.fromCache ? ' • cached result' : ''} — research data only, not a score`,
  });

  return embed;
}

module.exports = { buildXAnalysisEmbed };
