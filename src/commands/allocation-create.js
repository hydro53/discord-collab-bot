const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { requireTier, TIER_COLLAB_MANAGER } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('allocation-create')
    .setDescription('Create an allocation for a collab')
    .addIntegerOption(opt => opt.setName('collab_id').setDescription('Collab ID').setRequired(true)),

  async execute(interaction) {
    // Modal cannot be deferred first
    if (!(await requireTier(interaction, TIER_COLLAB_MANAGER))) return;

    const collabId = interaction.options.getInteger('collab_id');

    const modal = new ModalBuilder()
      .setCustomId(`allocationCreate:${collabId}`)
      .setTitle('Create Allocation');

    const name = new TextInputBuilder()
      .setCustomId('name')
      .setLabel('Allocation Name')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(45)
      .setRequired(true);

    const spots = new TextInputBuilder()
      .setCustomId('spots')
      .setLabel('Number of Spots')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(5)
      .setRequired(false);

    const deadline = new TextInputBuilder()
      .setCustomId('deadline')
      .setLabel('Deadline (free text)')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(name),
      new ActionRowBuilder().addComponents(spots),
      new ActionRowBuilder().addComponents(deadline)
    );

    await interaction.showModal(modal);
  }
};
