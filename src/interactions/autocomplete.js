const pool = require('../db/pool');

async function handleAutocomplete(interaction) {
  const focused = interaction.options.getFocused(true);

  if (focused.name === 'target') {
    const query = focused.value || '';
    // Visibility filtering only applies to *discovering new partners*
    // (request-collab, server-profile search). Blocking/unblocking needs
    // to find a server that already contacted you even if they're
    // unlisted, so those commands search the full directory.
    const respectsVisibility = !['server-block', 'server-unblock'].includes(interaction.commandName);
    const visibilityClause = respectsVisibility ? `AND visibility = 'public'` : '';

    const { rows } = await pool.query(
      `SELECT guild_id, name, server_type FROM server_profiles
       WHERE guild_id != $1 AND name ILIKE $2 ${visibilityClause}
       ORDER BY name LIMIT 20`,
      [interaction.guildId, `%${query}%`]
    );
    await interaction.respond(rows.map((r) => ({ name: `${r.name} (${r.server_type})`, value: r.guild_id })));
    return;
  }

  await interaction.respond([]);
}

module.exports = { handleAutocomplete };
