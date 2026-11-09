const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-accepting')
    .setDescription('server accepting'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'server-accepting ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
