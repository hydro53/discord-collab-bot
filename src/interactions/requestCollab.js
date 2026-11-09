const pool = require('../db/pool');

module.exports = {
  autocomplete: {
    name: 'request-collab',
    async execute(interaction) {
      const focused = interaction.options.getFocused();
      const res = await pool.query(
        `SELECT guild_id, name FROM guilds
         WHERE name ILIKE $1 AND guild_id != $2 AND visibility = 'public' AND accepting_collabs = true
         LIMIT 25`,
        [`%${focused}%`, interaction.guildId]
      );

      const choices = res.rows.map(r => ({
        name: r.name || r.guild_id,
        value: r.guild_id
      }));

      await interaction.respond(choices);
    }
  }
};
