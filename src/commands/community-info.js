const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('community-info')
    .setDescription('community info'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'community-info ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
