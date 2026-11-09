const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../db/pool');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sybil-wallet')
    .setDescription('Check a single wallet for Sybil indicators')
    .addStringOption(opt => opt.setName('wallet').setDescription('Wallet address').setRequired(true))
    .addStringOption(opt =>
      opt.setName('chain')
        .setDescription('Chain')
        .addChoices(
          { name: 'EVM', value: 'evm' },
          { name: 'Solana', value: 'solana' }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const wallet = interaction.options.getString('wallet');
    const chain = interaction.options.getString('chain') || 'evm';

    const embed = new EmbedBuilder()
      .setTitle(`Sybil Check: ${wallet.slice(0, 10)}...`)
      .addFields(
        { name: 'Chain', value: chain, inline: true },
        { name: 'Age', value: process.env.ALCHEMY_API_KEY || process.env.QUICKNODE_SOLANA_RPC_URL ? 'Unavailable (scan required)' : 'Unavailable (no API key)', inline: true },
        { name: 'Tx Count', value: 'Unavailable', inline: true },
        { name: 'Funding Cluster', value: 'Unavailable', inline: true }
      )
      .setFooter({ text: 'No fake data. Configure Alchemy/QuickNode for real checks.' });

    await interaction.editReply({ embeds: [embed] });
  }
};
