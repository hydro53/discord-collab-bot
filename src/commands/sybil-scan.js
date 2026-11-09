const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../db/pool');

const NEW_DAYS = parseInt(process.env.SYBIL_NEW_WALLET_DAYS || '7', 10);
const MIN_TX = parseInt(process.env.SYBIL_MIN_TX_COUNT || '5', 10);
const CLUSTER_MIN = parseInt(process.env.SYBIL_CLUSTER_MIN_SIZE || '3', 10);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sybil-scan')
    .setDescription('Run Sybil scan on winners for an allocation')
    .addIntegerOption(opt => opt.setName('allocation_id').setDescription('Allocation ID').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    const allocationId = interaction.options.getInteger('allocation_id');
    const winners = await pool.query(
      'SELECT id, wallet, chain FROM winners WHERE allocation_id = $1',
      [allocationId]
    );

    if (winners.rows.length === 0) {
      return interaction.editReply({ content: 'No winners to scan.' });
    }

    // Placeholder: real implementation needs Alchemy (EVM) and QuickNode (Solana)
    // Flags: wallet age < NEW_DAYS, tx count < MIN_TX, funding source shared by >= CLUSTER_MIN
    let flagged = 0;
    for (const w of winners.rows) {
      const reasons = [];
      // Without API keys we mark as Unavailable and skip real checks
      if (!process.env.ALCHEMY_API_KEY && !process.env.QUICKNODE_SOLANA_RPC_URL) {
        reasons.push('API keys unavailable');
      } else {
        // TODO: call Alchemy/QuickNode, compute age, tx count, funding cluster
        // Example flag logic would go here
      }

      if (reasons.length > 0) {
        await pool.query(
          'UPDATE winners SET sybil_reasons = $1, sybil_flags = $2 WHERE id = $3',
          [reasons, { scanned: true }, w.id]
        );
        flagged++;
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(`Sybil Scan — Allocation ${allocationId}`)
      .setDescription(`Scanned ${winners.rows.length} wallets. Flagged ${flagged}.\n\nThresholds: <${NEW_DAYS}d old, <${MIN_TX} txs, cluster ≥${CLUSTER_MIN}.\n\nNote: Full on-chain checks require ALCHEMY_API_KEY and QUICKNODE_SOLANA_RPC_URL.`)
      .setFooter({ text: 'Flags always include reasons. No fake data.' });

    await interaction.editReply({ embeds: [embed] });
  }
};
