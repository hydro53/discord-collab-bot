const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const pool = require('../db/pool');
const { requireManager } = require('../utils/permissions');
const { logAction } = require('../utils/auditLog');
const { analyzeHandle } = require('../utils/xAnalysis');
const { buildXAnalysisEmbed } = require('../utils/xAnalysisEmbed');
const { resolveChannel } = require('../utils/guildChannels');

async function handleCollabRequestButton(interaction, action, requestId) {
  const { rows } = await pool.query(`SELECT * FROM collab_requests WHERE id = $1`, [requestId]);
  if (!rows.length) {
    await interaction.reply({ content: '❌ This request no longer exists.', ephemeral: true });
    return;
  }
  const request = rows[0];

  // Only the receiving server can act on its own incoming request.
  if (interaction.guildId !== request.receiving_guild_id) {
    await interaction.reply({ content: '❌ This request belongs to a different server.', ephemeral: true });
    return;
  }

  if (action === 'analysis') {
    // Deferred before the permission check here (unlike accept/decline)
    // because this always sends a fresh ephemeral reply — it never edits
    // the original request message, so there's no risk of a denied user's
    // rejection clobbering the collab request embed.
    await interaction.deferReply({ ephemeral: true });
    if (!(await requireManager(interaction))) return; // gated: this can incur real API cost
    await handleAnalysisButton(interaction, request);
    return;
  }

  if (request.status !== 'pending') {
    await interaction.reply({ content: `This request was already **${request.status}** — no further action needed.`, ephemeral: true });
    return;
  }

  if (!(await requireManager(interaction))) return;

  if (action === 'accept') {
    await interaction.deferUpdate();
    await acceptRequest(interaction, request);
    return;
  }

  if (action === 'decline') {
    const modal = new ModalBuilder().setCustomId(`collabReqDeclineModal:${requestId}`).setTitle('Decline collab request');
    const reason = new TextInputBuilder()
      .setCustomId('reason')
      .setLabel('Reason (optional, shared with requester)')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(1000)
      .setRequired(false);
    modal.addComponents(new ActionRowBuilder().addComponents(reason));
    await interaction.showModal(modal);
    return;
  }
}

async function handleAnalysisButton(interaction, request) {
  const { rows: profileRows } = await pool.query(`SELECT x_handle, name FROM server_profiles WHERE guild_id = $1`, [
    request.requesting_guild_id,
  ]);
  const profile = profileRows[0];

  if (!profile?.x_handle) {
    await interaction.editReply({ content: "🔎 No X handle on file for the requesting server's profile — nothing to analyze." });
    return;
  }
  if (!process.env.X_BEARER_TOKEN) {
    await interaction.editReply({ content: "🔎 X analysis isn't configured yet (missing API credentials)." });
    return;
  }

  const handle = profile.x_handle.replace(/^@/, '');

  try {
    const data = await analyzeHandle(handle);
    await interaction.editReply({ embeds: [buildXAnalysisEmbed(handle, data)] });
  } catch (err) {
    console.error('X analysis failed:', err);
    await interaction.editReply(`🔎 Couldn't fetch X data right now (${err.message || 'unknown error'}). Try again later.`);
  }
}

async function acceptRequest(interaction, request) {
  const [{ rows: receivingProfileRows }, { rows: requestingProfileRows }] = await Promise.all([
    pool.query(`SELECT * FROM server_profiles WHERE guild_id = $1`, [request.receiving_guild_id]),
    pool.query(`SELECT * FROM server_profiles WHERE guild_id = $1`, [request.requesting_guild_id]),
  ]);
  const receivingProfile = receivingProfileRows[0];
  const requestingProfile = requestingProfileRows[0];

  const { rows: collabRows } = await pool.query(
    `INSERT INTO collabs (
       guild_id, requested_by_id, requested_by_tag, project_name, project_x_handle,
       community_x_handle, discord_invite, website, contact_person, requested_allocation,
       collab_type, mint_date, chain, additional_info, status, channel_id,
       collab_request_id, requesting_guild_id, requesting_channel_id
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'confirmed',$15,$16,$17,$18)
     RETURNING *`,
    [
      request.receiving_guild_id,
      request.requested_by_id,
      request.requested_by_tag,
      receivingProfile?.name || 'Unnamed Project',
      receivingProfile?.x_handle || null,
      requestingProfile?.x_handle || null,
      requestingProfile?.discord_invite || null,
      receivingProfile?.website || null,
      request.requested_by_tag,
      request.requested_allocation,
      request.collab_type,
      request.mint_date,
      request.chain,
      request.additional_info,
      request.request_channel_id,
      request.id,
      request.requesting_guild_id,
      request.requesting_channel_id,
    ]
  );
  const collab = collabRows[0];

  await pool.query(
    `UPDATE collab_requests SET status = 'accepted', responded_by_id = $1, responded_by_tag = $2, responded_at = now(), resulting_collab_id = $3 WHERE id = $4`,
    [interaction.user.id, interaction.user.tag, collab.id, request.id]
  );

  await logAction(interaction, 'collab_request_accepted', `from ${requestingProfile?.name || 'unknown'}`, collab.id);

  // Update the original request embed in place to show it's confirmed.
  const confirmedEmbed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle('🤝 COLLAB CONFIRMED')
    .setDescription(
      `**${requestingProfile?.name || 'Requester'}** × **${receivingProfile?.name || 'This server'}**\n\nCollab ID: **#${collab.id}**\nStatus: **Confirmed**\n\nAccepted by <@${interaction.user.id}>`
    );
  await interaction.editReply({ embeds: [confirmedEmbed], components: [] });

  // Notify the requesting server — prefer their dedicated notifications
  // channel if configured, otherwise fall back to wherever /request-collab
  // was originally run.
  const notifyChannelId = await resolveChannel(request.requesting_guild_id, 'notifications', request.requesting_channel_id);
  if (notifyChannelId) {
    const requesterChannel = await interaction.client.channels.fetch(notifyChannelId).catch(() => null);
    if (requesterChannel) {
      const notifyEmbed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('🎉 COLLAB ACCEPTED')
        .setDescription(
          `**${receivingProfile?.name || 'The server you contacted'}** has accepted your collaboration request.\n\nCollab ID: **#${collab.id}**\nStatus: **Confirmed**`
        );
      await requesterChannel.send({ embeds: [notifyEmbed] }).catch(() => {});
    }
  }
}

module.exports = { handleCollabRequestButton };
