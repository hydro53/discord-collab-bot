const { SlashCommandBuilder } = require('discord.js');
const pool = require('../db/pool');
const { requireTier, TIER_COLLAB_MANAGER } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('request-collab')
    .setDescription('Request a collaboration with another server')
    .addStringOption(option =>
      option.setName('target')
        .setDescription('Target server (autocomplete)')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!(await requireTier(interaction, TIER_COLLAB_MANAGER, true))) return;

    const targetId = interaction.options.getString('target');
    if (targetId === interaction.guildId) {
      return interaction.editReply({ content: 'Cannot request collab with yourself.' });
    }

    // Check blocked, accepting, etc.
    const target = await pool.query('SELECT accepting_collabs FROM guilds WHERE guild_id = $1', [targetId]);
    if (target.rows.length === 0) {
      return interaction.editReply({ content: 'Target server not found or not set up.' });
    }
    if (!target.rows[0].accepting_collabs) {
      return interaction.editReply({ content: 'Target server is not accepting collabs.' });
    }

    try {
      const insert = await pool.query(
        `INSERT INTO collabs (requester_guild_id, target_guild_id, status)
         VALUES ($1, $2, 'pending')
         ON CONFLICT (requester_guild_id, target_guild_id) DO NOTHING
         RETURNING id`,
        [interaction.guildId, targetId]
      );

      if (insert.rows.length === 0) {
        return interaction.editReply({ content: 'A pending request already exists with this server.' });
      }

      const collabId = insert.rows[0].id;

      // Notify target server with richer embed
      const channelRes = await pool.query(
        `SELECT channel_id FROM guild_channels WHERE guild_id = $1 AND purpose = 'requests'`,
        [targetId]
      );

      let requestMsgId = null;
      let requestChannelId = null;

      if (channelRes.rows.length > 0) {
        const channelId = channelRes.rows[0].channel_id;
        const channel = await interaction.client.channels.fetch(channelId).catch(() => null);
        if (channel) {
          const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

          // Fetch requester profile
          const reqProfile = await pool.query(
            'SELECT name, server_type, x_handle, website, discord_invite FROM guilds WHERE guild_id = $1',
            [interaction.guildId]
          );
          const p = reqProfile.rows[0] || {};

          const embed = new EmbedBuilder()
            .setTitle('📥 NEW COLLAB REQUEST')
            .setColor(0x5865F2)
            .addFields(
              { name: 'Requester', value: `${p.name || interaction.guild.name}\n(${p.server_type || 'Community'})`, inline: true },
              { name: 'Status', value: 'Pending', inline: true },
              { name: 'X Handle', value: p.x_handle || 'Unavailable', inline: true },
              { name: 'Website', value: p.website || 'Unavailable', inline: true },
              { name: 'Discord Invite', value: p.discord_invite || 'Unavailable', inline: true },
              { name: 'Contact', value: `<@${interaction.user.id}>`, inline: true }
            )
            .setFooter({ text: `Request #${collabId}` });

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`viewAnalysis:${interaction.guildId}`)
              .setLabel('View Analysis')
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId(`collabAccept:${collabId}`)
              .setLabel('Accept')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`collabDecline:${collabId}`)
              .setLabel('Decline')
              .setStyle(ButtonStyle.Danger)
          );

          const sent = await channel.send({ embeds: [embed], components: [row] });
          requestMsgId = sent.id;
          requestChannelId = channel.id;
        }
      }

      // Store message location so we can edit it later
      if (requestMsgId) {
        await pool.query(
          'UPDATE collabs SET request_message_id = $1, request_channel_id = $2 WHERE id = $3',
          [requestMsgId, requestChannelId, collabId]
        );
      }

      await interaction.editReply({
        content: `Collab request #${collabId} sent to the project. They will review it in their requests channel.`
      });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: 'Failed to create request.' });
    }
  }
};
