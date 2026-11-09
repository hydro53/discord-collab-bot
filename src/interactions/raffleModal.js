const pool = require('../db/pool');
const { getDraft, deleteDraft } = require('../utils/drafts');
const { logAction } = require('../utils/auditLog');

async function handleRaffleModalSubmit(interaction) {
  const [, draftId] = interaction.customId.split(':');
  const draft = getDraft(draftId);

  if (!draft) {
    await interaction.reply({
      content: '⚠️ This submission expired (drafts last 15 minutes). Please run /raffle-submit again.',
      ephemeral: true,
    });
    return;
  }

  const deadline = interaction.fields.getTextInputValue('deadline');
  const expectedWinnersRaw = interaction.fields.getTextInputValue('expectedWinners');
  const contact = interaction.fields.getTextInputValue('contact');
  const parsedExpected = expectedWinnersRaw ? parseInt(expectedWinnersRaw, 10) : null;
  const expectedWinners = Number.isNaN(parsedExpected) ? null : parsedExpected;

  // Resubmission overwrites the previous raffle link for this community
  // rather than accumulating duplicates.
  await pool.query(`DELETE FROM raffles WHERE collab_id = $1 AND community_id = $2`, [
    draft.collabId,
    draft.communityId,
  ]);

  await pool.query(
    `INSERT INTO raffles (
       collab_id, community_id, community_name_snapshot, raffle_link, deadline, expected_winners, contact, status, submitted_by
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,'submitted',$8)`,
    [draft.collabId, draft.communityId, draft.communityName, draft.link, deadline || null, expectedWinners, contact || null, interaction.user.tag]
  );

  await pool.query(`UPDATE allocations SET status = 'raffle_submitted' WHERE collab_id = $1 AND community_id = $2`, [
    draft.collabId,
    draft.communityId,
  ]);

  deleteDraft(draftId);

  await logAction(interaction, 'raffle_submitted', `${draft.communityName}: ${draft.link}`, draft.collabId);

  await interaction.reply({
    content: `✅ Raffle link recorded for **${draft.communityName}** on collab #${draft.collabId}.`,
    ephemeral: true,
  });
}

module.exports = { handleRaffleModalSubmit };
