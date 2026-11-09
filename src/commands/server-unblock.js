const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-unblock')
    .setDescription('server unblock'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'server-unblock ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
