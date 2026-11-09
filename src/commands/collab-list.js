const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../db/pool');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('collab-list')
    .setDescription('List collabs for this server'),

  async execute(interaction) {
    await interaction.deferReply();

    const res = await pool.query(
      `SELECT id, requester_guild_id, target_guild_id, status, created_at
       FROM collabs
       WHERE requester_guild_id = $1 OR target_guild_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [interaction.guildId]
    );

    if (res.rows.length === 0) {
      return interaction.editReply({ content: 'No collabs found.' });
    }

    const lines = res.rows.map(r => {
      const role = r.requester_guild_id === interaction.guildId ? 'Requester' : 'Target';
      return `ID ${r.id} | ${r.status} | ${role} | ${new Date(r.created_at).toLocaleDateString()}`;
    });

    const embed = new EmbedBuilder()
      .setTitle('Collabs')
      .setDescription(lines.join('\n').slice(0, 4000) || 'None');

    await interaction.editReply({ embeds: [embed] });
  }
};
