const pool = require('../db/pool');
const { logAction } = require('../utils/auditLog');

async function handleAllocationModalSubmit(interaction) {
  const [, collabId, communityId, amount, type] = interaction.customId.split(':');

  const mintDate = interaction.fields.getTextInputValue('mintDate');
  const mintLink = interaction.fields.getTextInputValue('mintLink');
  const requirements = interaction.fields.getTextInputValue('requirements');
  const deadline = interaction.fields.getTextInputValue('deadline');
  const notes = interaction.fields.getTextInputValue('notes');

  const { rows: communityRows } = await pool.query(`SELECT name FROM communities WHERE id = $1`, [communityId]);
  const communityName = communityRows[0]?.name || 'Unknown Community';

  await pool.query(
    `INSERT INTO allocations (
       collab_id, community_id, community_name_snapshot, amount, allocation_type,
       mint_date, mint_link, requirements, deadline, notes, status
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending')`,
    [
      collabId,
      communityId,
      communityName,
      Number(amount),
      type,
      mintDate || null,
      mintLink || null,
      requirements || null,
      deadline || null,
      notes || null,
    ]
  );

  await interaction.reply({
    content: `✅ Allocation created for **${communityName}**: ${amount} (${type}) on collab #${collabId}.`,
    ephemeral: true,
  });

  await logAction(interaction, 'allocation_created', `${communityName}: ${amount} (${type})`, Number(collabId));
}

module.exports = { handleAllocationModalSubmit };
