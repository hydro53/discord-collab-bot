const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { requireTier, TIER_COLLAB_MANAGER } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('winners-submit-manual')
    .setDescription('Submit winners by pasting wallets')
    .addIntegerOption(opt => opt.setName('allocation_id').setDescription('Allocation ID').setRequired(true)),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER_COLLAB_MANAGER))) return;

    const allocationId = interaction.options.getInteger('allocation_id');

    const modal = new ModalBuilder()
      .setCustomId(`winnersManual:${allocationId}`)
      .setTitle('Submit Winners');

    const walletsInput = new TextInputBuilder()
      .setCustomId('wallets')
      .setLabel('Wallets (one per line)')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(4000)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(walletsInput));
    await interaction.showModal(modal);
  }
};
