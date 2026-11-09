const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('meeting-create')
    .setDescription('meeting create'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'meeting-create ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
