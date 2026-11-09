const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const pool = require('../db/pool');
const { stringify } = require('csv-stringify/sync');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('export-clean')
    .setDescription('Export winners without duplicates or Sybil flags')
    .addIntegerOption(opt => opt.setName('allocation_id').setDescription('Allocation ID').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    const allocationId = interaction.options.getInteger('allocation_id');
    const res = await pool.query(
      `SELECT wallet, chain, submitted_at FROM winners
       WHERE allocation_id = $1 AND is_duplicate = false AND (sybil_reasons IS NULL OR array_length(sybil_reasons, 1) IS NULL)`,
      [allocationId]
    );

    if (res.rows.length === 0) {
      return interaction.editReply({ content: 'No clean winners found.' });
    }

    const csv = stringify(res.rows, { header: true });
    const attachment = new AttachmentBuilder(Buffer.from(csv), { name: `clean-${allocationId}.csv` });

    await interaction.editReply({ content: `Exported ${res.rows.length} clean winners.`, files: [attachment] });
  }
};
