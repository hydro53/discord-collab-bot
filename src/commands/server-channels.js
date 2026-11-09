const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../db/pool');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-channels')
    .setDescription('List configured channels for this server'),

  async execute(interaction) {
    await interaction.deferReply();

    const res = await pool.query(
      'SELECT purpose, channel_id FROM guild_channels WHERE guild_id = $1',
      [interaction.guildId]
    );

    if (res.rows.length === 0) {
      return interaction.editReply({ content: 'No channels configured. Use /server-init-channels or /server-set-channel.' });
    }

    const lines = res.rows.map(r => `${r.purpose}: <#${r.channel_id}>`);
    const embed = new EmbedBuilder()
      .setTitle('Configured Channels')
      .setDescription(lines.join('\n'));

    await interaction.editReply({ embeds: [embed] });
  }
};
