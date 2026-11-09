const pool = require('../db/pool');

module.exports = {
  modal: {
    customId: 'serverSetupModal',
    async execute(interaction) {
      await interaction.deferReply({ ephemeral: true });

      const displayName = interaction.fields.getTextInputValue('displayName');
      const description = interaction.fields.getTextInputValue('description') || null;

      await pool.query(
        `INSERT INTO guilds (guild_id, name)
         VALUES ($1, $2)
         ON CONFLICT (guild_id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()`,
        [interaction.guildId, displayName]
      );

      // Store description if we add a column; for now just name
      await interaction.editReply({ content: `Server set up as **${displayName}**.` });
    }
  }
};
