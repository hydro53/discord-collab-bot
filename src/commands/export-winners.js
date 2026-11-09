const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const pool = require('../db/pool');
const { stringify } = require('csv-stringify/sync');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('export-winners')
    .setDescription('Export winners as CSV')
    .addIntegerOption(opt => opt.setName('allocation_id').setDescription('Allocation ID').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    const allocationId = interaction.options.getInteger('allocation_id');
    const res = await pool.query(
      'SELECT wallet, chain, is_duplicate, sybil_reasons, submitted_at FROM winners WHERE allocation_id = $1',
      [allocationId]
    );

    if (res.rows.length === 0) {
      return interaction.editReply({ content: 'No winners found.' });
    }

    const csv = stringify(res.rows, { header: true });
    const attachment = new AttachmentBuilder(Buffer.from(csv), { name: `winners-${allocationId}.csv` });

    await interaction.editReply({ content: `Exported ${res.rows.length} winners.`, files: [attachment] });
  }
};
