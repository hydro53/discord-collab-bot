const { SlashCommandBuilder } = require('discord.js');
const pool = require('../db/pool');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('duplicates-check')
    .setDescription('Flag duplicate wallets across winners')
    .addIntegerOption(opt => opt.setName('allocation_id').setDescription('Allocation ID (optional)').setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply();

    const allocationId = interaction.options.getInteger('allocation_id');

    let query = `
      UPDATE winners w
      SET is_duplicate = true
      WHERE wallet IN (
        SELECT wallet FROM winners
        GROUP BY wallet
        HAVING COUNT(*) > 1
      )
    `;
    const params = [];
    if (allocationId) {
      query += ' AND allocation_id = $1';
      params.push(allocationId);
    }

    const res = await pool.query(query, params);
    await interaction.editReply({ content: `Marked ${res.rowCount} duplicate wallet rows.` });
  }
};
