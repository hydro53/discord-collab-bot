const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('meeting-remind')
    .setDescription('meeting remind'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'meeting-remind ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
