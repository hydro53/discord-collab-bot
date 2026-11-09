const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const pool = require('../db/pool');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('requests-pending')
    .setDescription('List pending collab requests for this server'),

  async execute(interaction) {
    await interaction.deferReply();

    const res = await pool.query(
      `SELECT c.id, c.requester_guild_id, g.name
       FROM collabs c
       LEFT JOIN guilds g ON g.guild_id = c.requester_guild_id
       WHERE c.target_guild_id = $1 AND c.status = 'pending'
       ORDER BY c.created_at DESC`,
      [interaction.guildId]
    );

    if (res.rows.length === 0) {
      return interaction.editReply({ content: 'No pending requests.' });
    }

    const embeds = [];
    const components = [];

    for (const r of res.rows.slice(0, 5)) { // limit for message size
      const embed = new EmbedBuilder()
        .setTitle(`Request #${r.id}`)
        .setDescription(`From: ${r.name || r.requester_guild_id}`)
        .setFooter({ text: 'Accept creates the collab and notifies both sides.' });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`collabAccept:${r.id}`)
          .setLabel('Accept')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`collabDecline:${r.id}`)
          .setLabel('Decline')
          .setStyle(ButtonStyle.Danger)
      );

      embeds.push(embed);
      components.push(row);
    }

    await interaction.editReply({ embeds, components });
  }
};
