const { EmbedBuilder } = require('discord.js');
const { truncateText } = require('./formatList');

const STATUS_LABELS = {
  new: '🆕 New',
  reviewing: '🔎 Reviewing',
  negotiating: '💬 Negotiating',
  confirmed: '✅ Confirmed',
  allocation_sent: '🎟️ Allocation Sent',
  raffle_live: '🎲 Raffle Live',
  winners_pending: '⏳ Winners Pending',
  winners_collected: '🏆 Winners Collected',
  wallet_scan_complete: '🛡️ Wallet Scan Complete',
  completed: '📦 Completed',
};

const STATUS_COLORS = {
  new: 0x5865f2,
  reviewing: 0xfee75c,
  negotiating: 0xfee75c,
  confirmed: 0x57f287,
  allocation_sent: 0x57f287,
  raffle_live: 0xeb459e,
  winners_pending: 0xfaa61a,
  winners_collected: 0x57f287,
  wallet_scan_complete: 0x57f287,
  completed: 0x2f3136,
};

function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}

function buildCollabEmbed(collab) {
  return new EmbedBuilder()
    .setColor(STATUS_COLORS[collab.status] || 0x5865f2)
    .setTitle(`🤝 ${collab.project_name}`)
    .setDescription(`Status: **${statusLabel(collab.status)}**`)
    .addFields(
      { name: 'Project X', value: collab.project_x_handle || '—', inline: true },
      { name: 'Community X', value: collab.community_x_handle || '—', inline: true },
      { name: 'Chain', value: collab.chain || '—', inline: true },
      { name: 'Discord Invite', value: collab.discord_invite || '—', inline: true },
      { name: 'Website', value: collab.website || '—', inline: true },
      { name: 'Contact', value: collab.contact_person || '—', inline: true },
      { name: 'Requested Allocation', value: collab.requested_allocation || '—', inline: true },
      { name: 'Collab Type', value: collab.collab_type || '—', inline: true },
      { name: 'Mint/Drop Date', value: collab.mint_date || '—', inline: true },
      { name: 'Additional Info', value: truncateText(collab.additional_info) || '—', inline: false }
    )
    .setFooter({ text: `Collab #${collab.id} • requested by ${collab.requested_by_tag}` })
    .setTimestamp(new Date(collab.created_at));
}

function buildCommandCenterEmbed(collab, counts) {
  const { allocations = 0, communities = 0, wallets = 0, duplicates = 0, sybilFlags = 0 } = counts;
  return new EmbedBuilder()
    .setColor(STATUS_COLORS[collab.status] || 0x5865f2)
    .setTitle(`🤝 ${collab.project_name.toUpperCase()} COLLAB COMMAND CENTER`)
    .setDescription(`Status: **${statusLabel(collab.status)}**`)
    .addFields(
      { name: 'Communities', value: `${communities}`, inline: true },
      { name: 'Allocations', value: `${allocations}`, inline: true },
      { name: 'Wallets Collected', value: `${wallets}`, inline: true },
      { name: 'Duplicates', value: `${duplicates}`, inline: true },
      { name: 'Sybil Flags', value: `${sybilFlags}`, inline: true },
      { name: 'Chain', value: collab.chain || '—', inline: true }
    )
    .setFooter({ text: `Collab #${collab.id}` })
    .setTimestamp();
}

module.exports = { buildCollabEmbed, buildCommandCenterEmbed, statusLabel, STATUS_LABELS };
