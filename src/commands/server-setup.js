const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { requireTier, TIER_ADMIN } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-setup')
    .setDescription('Set up or update this server profile')
    .addStringOption(opt =>
      opt.setName('type')
        .setDescription('Server type')
        .setRequired(true)
        .addChoices(
          { name: 'Project', value: 'Project' },
          { name: 'Community', value: 'Community' },
          { name: 'Both', value: 'Both' }
        )
    ),

  async execute(interaction) {
    if (!(await requireTier(interaction, TIER_ADMIN))) return;

    const type = interaction.options.getString('type');

    const modal = new ModalBuilder()
      .setCustomId(`serverSetupModal:${type}`)
      .setTitle('Server Setup');

    const nameInput = new TextInputBuilder()
      .setCustomId('displayName')
      .setLabel('Display Name')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(45)
      .setRequired(true);

    const xInput = new TextInputBuilder()
      .setCustomId('xHandle')
      .setLabel('X/Twitter Handle (optional)')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(50)
      .setRequired(false);

    const webInput = new TextInputBuilder()
      .setCustomId('website')
      .setLabel('Website (optional)')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(200)
      .setRequired(false);

    const inviteInput = new TextInputBuilder()
      .setCustomId('discordInvite')
      .setLabel('Discord Invite (optional)')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(nameInput),
      new ActionRowBuilder().addComponents(xInput),
      new ActionRowBuilder().addComponents(webInput),
      new ActionRowBuilder().addComponents(inviteInput)
    );

    await interaction.showModal(modal);
  }
};