const pool = require('../db/pool');
const { getDraft, deleteDraft } = require('../utils/drafts');
const { logAction } = require('../utils/auditLog');

async function handleTemplateModalSubmit(interaction) {
  const [, draftId] = interaction.customId.split(':');
  const draft = getDraft(draftId);

  if (!draft) {
    await interaction.reply({
      content: '⚠️ This submission expired (drafts last 15 minutes). Please run /template-create again.',
      ephemeral: true,
    });
    return;
  }

  const content = interaction.fields.getTextInputValue('content');

  await pool.query(
    `INSERT INTO templates (guild_id, name, content, created_by)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (guild_id, name) DO UPDATE SET content = EXCLUDED.content, created_by = EXCLUDED.created_by`,
    [interaction.guildId, draft.name, content, interaction.user.tag]
  );

  deleteDraft(draftId);

  await logAction(interaction, 'template_created', draft.name);

  await interaction.reply({ content: `✅ Template **${draft.name}** saved. Use it with \`/template-use name:${draft.name}\`.`, ephemeral: true });
}

module.exports = { handleTemplateModalSubmit };
