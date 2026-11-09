const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../db/pool');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('collab-status')
    .setDescription('View status of a specific collab')
    .addIntegerOption(opt => opt.setName('collab_id').setDescription('Collab ID').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    const collabId = interaction.options.getInteger('collab_id');
    const res = await pool.query(
      'SELECT * FROM collabs WHERE id = $1 AND (requester_guild_id = $2 OR target_guild_id = $2)',
      [collabId, interaction.guildId]
    );

    if (res.rows.length === 0) {
      return interaction.editReply({ content: 'Collab not found or you do not have access.' });
    }

    const c = res.rows[0];
    const embed = new EmbedBuilder()
      .setTitle(`Collab #${c.id}`)
      .addFields(
        { name: 'Status', value: c.status, inline: true },
        { name: 'Requester', value: c.requester_guild_id, inline: true },
        { name: 'Target', value: c.target_guild_id, inline: true },
        { name: 'Created', value: new Date(c.created_at).toISOString(), inline: false }
      );

    await interaction.editReply({ embeds: [embed] });
  }
};
