const { SlashCommandBuilder } = require('discord.js');
const pool = require('../db/pool');
const { requireTier, TIER_ADMIN } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('permissions-list')
    .setDescription('List configured roles for this server'),

  async execute(interaction) {
    await interaction.deferReply();

    const res = await pool.query(
      'SELECT role_id, tier FROM guild_roles WHERE guild_id = $1',
      [interaction.guildId]
    );

    if (res.rows.length === 0) {
      return interaction.editReply({ content: 'No custom roles set. Manage Server always works for both tiers.' });
    }

    const lines = res.rows.map(r => `<@&${r.role_id}> → ${r.tier}`);
    await interaction.editReply({ content: lines.join('\n') });
  }
};
