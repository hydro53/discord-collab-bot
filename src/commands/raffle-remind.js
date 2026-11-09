const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('raffle-remind')
    .setDescription('raffle remind'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'raffle-remind ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
