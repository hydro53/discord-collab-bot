const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('my-workload')
    .setDescription('my workload'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'my-workload ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
