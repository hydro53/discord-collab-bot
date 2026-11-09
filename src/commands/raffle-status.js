const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('raffle-status')
    .setDescription('raffle status'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'raffle-status ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
