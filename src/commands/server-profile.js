const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../db/pool');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-profile')
    .setDescription('View this server\'s collab profile'),

  async execute(interaction) {
    await interaction.deferReply();

    const res = await pool.query('SELECT * FROM guilds WHERE guild_id = $1', [interaction.guildId]);
    const g = res.rows[0];

    if (!g) {
      return interaction.editReply({ content: 'Server not set up. Run /server-setup first.' });
    }

    const embed = new EmbedBuilder()
      .setTitle(g.name || interaction.guild.name)
      .setDescription(`Visibility: ${g.visibility}\nAccepting collabs: ${g.accepting_collabs ? 'Yes' : 'No'}`)
      .setFooter({ text: 'Metrics unavailable where not collected' });

    await interaction.editReply({ embeds: [embed] });
  }
};
