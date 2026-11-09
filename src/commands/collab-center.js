const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const pool = require('../db/pool');
const { requireTier, TIER_COLLAB_MANAGER } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('collab-center')
    .setDescription('Collab management hub'),

  async execute(interaction) {
    await interaction.deferReply();

    if (!(await requireTier(interaction, TIER_COLLAB_MANAGER, true))) return;

    const embed = new EmbedBuilder()
      .setTitle('Collab Center')
      .setDescription('Use the buttons or related commands to manage collabs.');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('collabListBtn').setLabel('List Collabs').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('myWorkloadBtn').setLabel('My Workload').setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  }
};
