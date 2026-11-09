const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const pool = require('../db/pool');
const { stringify } = require('csv-stringify/sync');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('export-flagged')
    .setDescription('Export flagged (duplicate or Sybil) winners')
    .addIntegerOption(opt => opt.setName('allocation_id').setDescription('Allocation ID').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    const allocationId = interaction.options.getInteger('allocation_id');
    const res = await pool.query(
      `SELECT wallet, chain, is_duplicate, sybil_reasons, submitted_at FROM winners
       WHERE allocation_id = $1 AND (is_duplicate = true OR (sybil_reasons IS NOT NULL AND array_length(sybil_reasons, 1) > 0))`,
      [allocationId]
    );

    if (res.rows.length === 0) {
      return interaction.editReply({ content: 'No flagged winners found.' });
    }

    const csv = stringify(res.rows, { header: true });
    const attachment = new AttachmentBuilder(Buffer.from(csv), { name: `flagged-${allocationId}.csv` });

    await interaction.editReply({ content: `Exported ${res.rows.length} flagged winners.`, files: [attachment] });
  }
};
