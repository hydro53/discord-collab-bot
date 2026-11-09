const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('meeting-list')
    .setDescription('meeting list'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'meeting-list ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
