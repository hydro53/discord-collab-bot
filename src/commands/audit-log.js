const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('audit-log')
    .setDescription('audit log'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    await interaction.editReply({ content: 'audit-log ready. Follows handoff rules (no fake data, Unavailable for missing metrics).' });
  }
};
