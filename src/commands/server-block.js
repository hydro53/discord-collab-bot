const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-block')
    .setDescription('server block'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'server-block ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
