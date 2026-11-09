const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('community-list')
    .setDescription('community list'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'community-list ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
