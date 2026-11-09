const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('collab-assign')
    .setDescription('collab assign'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'collab-assign ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
