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
      await pool.query(
        `INSERT INTO collabs (requester_guild_id, target_guild_id, status)
         VALUES ($1, $2, 'pending')
         ON CONFLICT (requester_guild_id, target_guild_id) DO NOTHING`,
        [interaction.guildId, targetId]
      );
      await interaction.editReply({ content: `Collab request sent to server ${targetId}.` });
      // TODO: notify target via their requests channel
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: 'Failed to create request.' });
    }
  }
};
