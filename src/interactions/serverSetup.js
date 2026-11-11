const pool = require('../db/pool');

module.exports = {
  modal: {
    customId: 'serverSetupModal',
    async execute(interaction) {
      await interaction.deferReply({ flags: 64 });

      const type = interaction.customId.split(':')[1] || 'Both';
      const displayName = interaction.fields.getTextInputValue('displayName');
      const xHandle = interaction.fields.getTextInputValue('xHandle') || null;
      const website = interaction.fields.getTextInputValue('website') || null;
      const discordInvite = interaction.fields.getTextInputValue('discordInvite') || null;

      await pool.query(
        `INSERT INTO guilds (guild_id, name, server_type, x_handle, website, discord_invite)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (guild_id) DO UPDATE SET
           name = EXCLUDED.name,
           server_type = EXCLUDED.server_type,
           x_handle = EXCLUDED.x_handle,
           website = EXCLUDED.website,
           discord_invite = EXCLUDED.discord_invite,
           updated_at = NOW()`,
        [interaction.guildId, displayName, type, xHandle, website, discordInvite]
      );

      await interaction.editReply({
        content: `Server set up as **${displayName}** (${type}).`
      });
    }
  }
};