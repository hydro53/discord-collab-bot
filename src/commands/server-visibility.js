const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-visibility')
    .setDescription('server visibility'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'server-visibility ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
