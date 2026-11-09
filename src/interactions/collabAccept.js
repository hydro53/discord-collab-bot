const pool = require('../db/pool');
const { requireTier, TIER_COLLAB_MANAGER } = require('../utils/permissions');

module.exports = {
  button: {
    customId: 'collabAccept',
    async execute(interaction) {
      // Check permission before defer so denial doesn't overwrite embed
      if (!(await requireTier(interaction, TIER_COLLAB_MANAGER))) return;

      await interaction.deferUpdate();

      const collabId = interaction.customId.split(':')[1];
      await pool.query(
        `UPDATE collabs SET status = 'accepted', updated_at = NOW() WHERE id = $1 AND status = 'pending'`,
        [collabId]
      );

      await interaction.followUp({ content: `Collab #${collabId} accepted.`, ephemeral: true });
      // TODO: notify both servers via their notification channels
    }
  }
};
