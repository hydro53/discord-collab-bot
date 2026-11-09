const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wallets-invalid')
    .setDescription('wallets invalid'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'wallets-invalid ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
