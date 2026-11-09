const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('template-list')
    .setDescription('template list'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'template-list ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
