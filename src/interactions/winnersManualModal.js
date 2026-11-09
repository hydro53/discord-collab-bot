const pool = require('../db/pool');
const { getDraft, deleteDraft } = require('../utils/drafts');
const { logAction } = require('../utils/auditLog');
const { classifyWalletAddress } = require('../utils/walletValidation');
const { insertWalletsBatch } = require('../utils/walletBatchInsert');

async function handleWinnersManualModalSubmit(interaction) {
  const [, draftId] = interaction.customId.split(':');
  const draft = getDraft(draftId);

  if (!draft) {
    await interaction.reply({
      content: '⚠️ This submission expired (drafts last 15 minutes). Please run /winners-submit-manual again.',
      ephemeral: true,
    });
    return;
  }

  // Defer immediately — with many pasted lines, the per-row work below can
  // exceed Discord's 3s initial-response window otherwise (this is exactly
  // what caused "The application did not respond" for larger pastes).
  await interaction.deferReply({ ephemeral: true });

  const raw = interaction.fields.getTextInputValue('wallets');
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const { rows: collabRows } = await pool.query(`SELECT chain FROM collabs WHERE id = $1`, [draft.collabId]);
  const chain = collabRows[0]?.chain || null;

  const toInsert = [];
  let invalidFormat = 0;
  for (const line of lines) {
    // Accepts either a bare wallet address, or "wallet,discord,x_handle"
    const [walletRaw, discordUser, xHandle] = line.split(',').map((p) => p.trim());
    const classified = classifyWalletAddress(walletRaw);
    if (!classified.rawInput.trim()) continue;
    if (!classified.isValidFormat) invalidFormat++;
    toInsert.push([draft.collabId, draft.communityId, classified.normalized, classified.rawInput, classified.isValidFormat, discordUser || null, xHandle || null, 'manual', chain]);
  }

  await insertWalletsBatch(toInsert);
  const inserted = toInsert.length;

  await pool.query(`UPDATE allocations SET status = 'completed' WHERE collab_id = $1 AND community_id = $2`, [
    draft.collabId,
    draft.communityId,
  ]);

  deleteDraft(draftId);

  await logAction(interaction, 'winners_imported', `${inserted} wallets (manual) for ${draft.communityName}${invalidFormat ? ` (${invalidFormat} flagged invalid format)` : ''}`, draft.collabId);

  await interaction.editReply({
    content: `✅ Added **${inserted}** wallet(s) for **${draft.communityName}**${invalidFormat ? ` (⚠️ ${invalidFormat} flagged as invalid address format — review before export)` : ''}.`,
  });
}

module.exports = { handleWinnersManualModalSubmit };
