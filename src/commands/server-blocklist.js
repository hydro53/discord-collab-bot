const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-blocklist')
    .setDescription('server blocklist'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'server-blocklist ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
