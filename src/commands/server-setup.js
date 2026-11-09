const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const pool = require('../db/pool');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-setup')
    .setDescription('Set up this server for collabs (opens a form)'),

  async execute(interaction) {
    // Cannot defer before modal
    const modal = new ModalBuilder()
      .setCustomId('serverSetupModal')
      .setTitle('Server Setup');

    const nameInput = new TextInputBuilder()
      .setCustomId('displayName')
      .setLabel('Display Name')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(45)
      .setRequired(true);

    const descInput = new TextInputBuilder()
      .setCustomId('description')
      .setLabel('Short Description')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(1000)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nameInput),
      new ActionRowBuilder().addComponents(descInput)
    );

    await interaction.showModal(modal);
  }
};
