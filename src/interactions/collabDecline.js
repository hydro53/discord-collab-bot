const pool = require('../db/pool');
const { requireTier, TIER_COLLAB_MANAGER } = require('../utils/permissions');
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  button: {
    customId: 'collabDecline',
    async execute(interaction) {
      if (!(await requireTier(interaction, TIER_COLLAB_MANAGER))) return;

      const collabId = interaction.customId.split(':')[1];

      const modal = new ModalBuilder()
        .setCustomId(`collabDeclineModal:${collabId}`)
        .setTitle('Decline Request');

      const reason = new TextInputBuilder()
        .setCustomId('reason')
        .setLabel('Reason (optional)')
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(500)
        .setRequired(false);

      modal.addComponents(new ActionRowBuilder().addComponents(reason));
      await interaction.showModal(modal);
    }
  }
};
