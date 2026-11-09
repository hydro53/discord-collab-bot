const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('collab-tasks')
    .setDescription('collab tasks'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'collab-tasks ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
