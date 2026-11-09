const pool = require('../db/pool');
const { buildWinnersCsvAttachment } = require('../utils/exportCsv');
const { getDuplicateDetails } = require('../utils/duplicates');
const { buildRsvpEmbed } = require('../utils/meetings');
const { handleCollabRequestButton } = require('./collabRequestButtons');
const { getAuthorizedCollab, isOwnerGuild } = require('../utils/collabAccess');
const { truncateLines } = require('../utils/formatList');

async function handleButton(interaction) {
  const [action, section, id] = interaction.customId.split(':');

  if (action === 'center') {
    await handleCenterButton(interaction, section, id);
    return;
  }
  if (action === 'sybil') {
    await handleSybilButton(interaction, section, id);
    return;
  }
  if (action === 'meetingRsvp') {
    await handleMeetingRsvp(interaction, section, id); // section = status, id = meetingId
    return;
  }
  if (action === 'collabReq') {
    await handleCollabRequestButton(interaction, section, id); // section = accept|decline|analysis, id = requestId
    return;
  }
}

async function handleMeetingRsvp(interaction, status, meetingId) {
  await pool.query(
    `INSERT INTO meeting_rsvps (meeting_id, user_id, user_tag, status)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (meeting_id, user_id) DO UPDATE SET status = EXCLUDED.status, responded_at = now()`,
    [meetingId, interaction.user.id, interaction.user.tag, status]
  );

  const { rows: meetingRows } = await pool.query(`SELECT * FROM meetings WHERE id = $1`, [meetingId]);
  if (!meetingRows.length) return;
  const meeting = meetingRows[0];

  const { rows: rsvpRows } = await pool.query(`SELECT user_id, status FROM meeting_rsvps WHERE meeting_id = $1`, [meetingId]);
  const byStatus = { going: [], cant_make_it: [], suggest_other: [] };
  for (const r of rsvpRows) {
    if (byStatus[r.status]) byStatus[r.status].push(r.user_id);
  }

  await interaction.update({ embeds: [buildRsvpEmbed(meeting, byStatus)] });
}

async function handleCenterButton(interaction, section, collabId) {
  const collab = await getAuthorizedCollab(collabId, interaction.guildId, 'any');
  if (!collab) {
    await interaction.reply({ content: `❌ No collab found with ID **${collabId}** that this server is part of.`, ephemeral: true });
    return;
  }

  const notBuiltYet = {
    analytics: 'Full analytics is available via the dedicated /analytics command.',
  };

  if (notBuiltYet[section]) {
    await interaction.reply({ content: `🚧 ${notBuiltYet[section]}`, ephemeral: true });
    return;
  }

  if (section === 'allocations') {
    const { rows } = await pool.query(
      `SELECT id, community_name_snapshot, amount, allocation_type, status FROM allocations WHERE collab_id = $1 ORDER BY id`,
      [collabId]
    );
    if (!rows.length) {
      await interaction.reply({
        content: '📭 No allocations yet for this collab. `/allocation create` arrives in Phase 2.',
        ephemeral: true,
      });
      return;
    }
    const lines = rows.map(
      (r) => `**${r.community_name_snapshot || 'Unknown'}** — ${r.amount ?? '?'} (${r.allocation_type || 'n/a'}) — ${r.status}`
    );
    await interaction.reply({ content: truncateLines(lines), ephemeral: true });
    return;
  }

  if (section === 'wallets') {
    const { rows } = await pool.query(
      `SELECT c.name AS community, COUNT(*)::int AS count
       FROM wallets w LEFT JOIN communities c ON c.id = w.community_id
       WHERE w.collab_id = $1 GROUP BY c.name ORDER BY c.name`,
      [collabId]
    );
    if (!rows.length) {
      await interaction.reply({
        content: '👛 No wallets collected yet. Use /winners-submit or /winners-submit-manual.',
        ephemeral: true,
      });
      return;
    }
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    const lines = rows.map((r) => `**${r.community || 'Unknown'}**: ${r.count}`);
    await interaction.reply({ content: `👛 **${total} wallets collected**\n\n${truncateLines(lines)}`, ephemeral: true });
    return;
  }

  if (section === 'raffles') {
    const { rows } = await pool.query(
      `SELECT a.community_name_snapshot, r.id AS raffle_id
       FROM allocations a
       LEFT JOIN raffles r ON r.collab_id = a.collab_id AND r.community_id = a.community_id
       WHERE a.collab_id = $1 ORDER BY a.community_name_snapshot`,
      [collabId]
    );
    if (!rows.length) {
      await interaction.reply({ content: 'No allocations yet — create one with /allocation-create first.', ephemeral: true });
      return;
    }
    const lines = rows.map((r) => (r.raffle_id ? `✅ ${r.community_name_snapshot}` : `⏳ ${r.community_name_snapshot}`));
    await interaction.reply({ content: truncateLines(lines), ephemeral: true });
    return;
  }

  if (section === 'winners') {
    const { rows } = await pool.query(
      `SELECT c.name AS community, COUNT(*)::int AS count
       FROM wallets w LEFT JOIN communities c ON c.id = w.community_id
       WHERE w.collab_id = $1 GROUP BY c.name ORDER BY c.name`,
      [collabId]
    );
    if (!rows.length) {
      await interaction.reply({
        content: '📭 No winner wallets collected yet. Use /winners-submit or /winners-submit-manual.',
        ephemeral: true,
      });
      return;
    }
    const lines = rows.map((r) => `**${r.community || 'Unknown'}**: ${r.count}`);
    await interaction.reply({ content: truncateLines(lines), ephemeral: true });
    return;
  }

  if (section === 'sybil') {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE sybil_flag)::int AS flagged,
              COUNT(*) FILTER (WHERE is_duplicate)::int AS duplicates
       FROM wallets WHERE collab_id = $1`,
      [collabId]
    );
    const r = rows[0];
    if (r.total === 0) {
      await interaction.reply({ content: '📭 No wallets to scan yet. Import winners first.', ephemeral: true });
      return;
    }
    await interaction.reply({
      content: `🛡️ Last known state — Flagged: **${r.flagged}** | Duplicates: **${r.duplicates}** | Total: **${r.total}**\nRun /sybil-scan to refresh this with a fresh on-chain check.`,
      ephemeral: true,
    });
    return;
  }

  if (section === 'meetings') {
    const { rows } = await pool.query(
      `SELECT id, title, scheduled_at FROM meetings WHERE collab_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [collabId]
    );
    if (!rows.length) {
      await interaction.reply({ content: 'No meetings scheduled yet for this collab. Use /meeting-create.', ephemeral: true });
      return;
    }
    const lines = rows.map((m) => `**#${m.id} — ${m.title}** — ${m.scheduled_at || 'time n/a'}`);
    await interaction.reply({ content: lines.join('\n'), ephemeral: true });
    return;
  }

  if (section === 'export') {
    if (!isOwnerGuild(collab, interaction.guildId)) {
      await interaction.reply({
        content: '❌ Only the server managing this collab (the one that accepted the request) can export the CSV.',
        ephemeral: true,
      });
      return;
    }
    const result = await buildWinnersCsvAttachment(collab);
    if (!result) {
      await interaction.reply({ content: '📭 No wallets collected yet for this collab.', ephemeral: true });
      return;
    }
    await interaction.reply({ content: `📤 Exported **${result.count}** wallet(s).`, files: [result.attachment], ephemeral: true });
    return;
  }
}

async function handleSybilButton(interaction, section, collabId) {
  if (section === 'flagged') {
    const { rows } = await pool.query(
      `SELECT wallet_address, sybil_reasons FROM wallets WHERE collab_id = $1 AND sybil_flag = TRUE ORDER BY id LIMIT 15`,
      [collabId]
    );
    if (!rows.length) {
      await interaction.reply({ content: '✅ No flagged wallets.', ephemeral: true });
      return;
    }
    const lines = rows.map((r) => `🚨 **${r.wallet_address}**\n${r.sybil_reasons}`);
    await interaction.reply({ content: lines.join('\n\n'), ephemeral: true });
    return;
  }

  if (section === 'duplicates') {
    const details = await getDuplicateDetails(collabId, 10);
    if (!details.length) {
      await interaction.reply({ content: '✅ No duplicate wallets.', ephemeral: true });
      return;
    }
    const lines = details.map((d) => `⚠️ **${d.address}**\nFound in: ${d.communities.join(', ')}`);
    await interaction.reply({ content: lines.join('\n\n'), ephemeral: true });
    return;
  }
}

module.exports = { handleButton };
