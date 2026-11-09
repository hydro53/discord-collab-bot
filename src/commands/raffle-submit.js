const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('raffle-submit')
    .setDescription('raffle submit'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'raffle-submit ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
