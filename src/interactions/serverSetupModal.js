const pool = require('../db/pool');
const { getDraft, deleteDraft } = require('../utils/drafts');

async function handleServerSetupModalSubmit(interaction) {
  const [, draftId] = interaction.customId.split(':');
  const draft = getDraft(draftId);

  if (!draft) {
    await interaction.reply({
      content: '⚠️ This setup expired (drafts last 15 minutes). Please run /server-setup again.',
      ephemeral: true,
    });
    return;
  }

  const name = interaction.fields.getTextInputValue('name');
  const xHandle = interaction.fields.getTextInputValue('xHandle');
  const website = interaction.fields.getTextInputValue('website');
  const discordInvite = interaction.fields.getTextInputValue('discordInvite');
  const chains = interaction.fields.getTextInputValue('chains');

  await pool.query(
    `INSERT INTO server_profiles (guild_id, server_type, name, x_handle, website, discord_invite, chains, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,now())
     ON CONFLICT (guild_id) DO UPDATE SET
       server_type = EXCLUDED.server_type, name = EXCLUDED.name, x_handle = EXCLUDED.x_handle,
       website = EXCLUDED.website, discord_invite = EXCLUDED.discord_invite, chains = EXCLUDED.chains,
       updated_at = now()`,
    [interaction.guildId, draft.serverType, name, xHandle || null, website || null, discordInvite || null, chains || null]
  );

  deleteDraft(draftId);

  await interaction.reply({
    content: `✅ Server profile saved as **${name}** (${draft.serverType}). Now set where incoming requests should be posted with \`/server-set-channel\`.`,
    ephemeral: true,
  });
}

module.exports = { handleServerSetupModalSubmit };
