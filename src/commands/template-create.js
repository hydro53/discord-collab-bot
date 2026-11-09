const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('template-create')
    .setDescription('template create'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'template-create ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
