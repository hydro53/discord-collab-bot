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

      // Notify target server
      const channelRes = await pool.query(
        `SELECT channel_id FROM guild_channels WHERE guild_id = $1 AND purpose = 'requests'`,
        [targetId]
      );
      if (channelRes.rows.length > 0) {
        const channelId = channelRes.rows[0].channel_id;
        const channel = await interaction.client.channels.fetch(channelId).catch(() => null);
        if (channel) {
          const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
          const embed = new EmbedBuilder()
            .setTitle(`New Collab Request #${collabId}`)
            .setDescription(`From server: ${interaction.guild.name}\nID: ${interaction.guildId}`)
            .setFooter({ text: 'Accept or Decline below' });

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`collabAccept:${collabId}`)
              .setLabel('Accept')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`collabDecline:${collabId}`)
              .setLabel('Decline')
              .setStyle(ButtonStyle.Danger)
          );

          await channel.send({ embeds: [embed], components: [row] });
        }
      }

      await interaction.editReply({ content: `Collab request #${collabId} sent.` });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: 'Failed to create request.' });
    }
  }
};
