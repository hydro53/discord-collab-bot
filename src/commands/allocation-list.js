const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../db/pool');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('allocation-list')
    .setDescription('List allocations for a collab')
    .addIntegerOption(opt => opt.setName('collab_id').setDescription('Collab ID').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    const collabId = interaction.options.getInteger('collab_id');
    const res = await pool.query(
      'SELECT id, name, spots, deadline, status FROM allocations WHERE collab_id = $1 ORDER BY id',
      [collabId]
    );

    if (res.rows.length === 0) {
      return interaction.editReply({ content: 'No allocations found.' });
    }

    const lines = res.rows.map(a => `#${a.id} ${a.name} | spots: ${a.spots ?? 'Unavailable'} | ${a.status} | deadline: ${a.deadline || 'Unavailable'}`);
    const embed = new EmbedBuilder()
      .setTitle(`Allocations for Collab ${collabId}`)
      .setDescription(lines.join('\n').slice(0, 4000));

    await interaction.editReply({ embeds: [embed] });
  }
};
