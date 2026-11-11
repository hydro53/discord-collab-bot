const pool = require('../db/pool');

module.exports = {
  autocomplete: {
    name: 'request-collab',
    async execute(interaction) {
      try {
        const focused = interaction.options.getFocused();
        const res = await pool.query(
          `SELECT guild_id, name FROM guilds
           WHERE (name ILIKE $1 OR guild_id ILIKE $1)
             AND guild_id != $2
             AND visibility = 'public'
             AND accepting_collabs = true
           LIMIT 25`,
          [`%${focused}%`, interaction.guildId]
        );

        const choices = res.rows.map(r => ({
          name: (r.name || r.guild_id).slice(0, 100),
          value: r.guild_id
        }));

        await interaction.respond(choices);
      } catch (err) {
        console.error('Autocomplete error:', err);
        // Must still respond or Discord times out
        await interaction.respond([]).catch(() => {});
      }
    }
  }
};
