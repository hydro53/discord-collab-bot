const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('community-note')
    .setDescription('community note'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'community-note ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
