const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const pool = require('../db/pool');
const { parse } = require('csv-parse/sync');
const { batchInsertWallets } = require('../utils/walletBatchInsert');
const { requireTier, TIER_COLLAB_MANAGER } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('winners-submit')
    .setDescription('Submit winners from a CSV file')
    .addIntegerOption(opt => opt.setName('allocation_id').setDescription('Allocation ID').setRequired(true))
    .addAttachmentOption(opt => opt.setName('csv').setDescription('CSV with wallet column').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!(await requireTier(interaction, TIER_COLLAB_MANAGER, true))) return;

    const allocationId = interaction.options.getInteger('allocation_id');
    const attachment = interaction.options.getAttachment('csv');

    if (!attachment || !attachment.name.endsWith('.csv')) {
      return interaction.editReply({ content: 'Please upload a .csv file.' });
    }

    // Size check (env MAX_CSV_UPLOAD_MB default 5)
    const maxMb = parseInt(process.env.MAX_CSV_UPLOAD_MB || '5', 10);
    if (attachment.size > maxMb * 1024 * 1024) {
      return interaction.editReply({ content: `File too large (max ${maxMb} MB).` });
    }

    const response = await fetch(attachment.url);
    const text = await response.text();

    let records;
    try {
      records = parse(text, { columns: true, skip_empty_lines: true, trim: true });
    } catch (e) {
      return interaction.editReply({ content: 'Failed to parse CSV.' });
    }

    const wallets = records
      .map(r => ({ wallet: (r.wallet || r.Wallet || r.address || '').trim(), chain: (r.chain || 'evm').toLowerCase() }))
      .filter(w => w.wallet && w.wallet.length > 10);

    if (wallets.length === 0) {
      return interaction.editReply({ content: 'No valid wallets found in CSV (expect "wallet" column).' });
    }

    const inserted = await batchInsertWallets(allocationId, interaction.guildId, wallets);

    await interaction.editReply({ content: `Processed ${wallets.length} wallets. Inserted ${inserted} new rows for allocation ${allocationId}.` });
  }
};
