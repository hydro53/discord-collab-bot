const pool = require('../db/pool');

module.exports = {
  modal: {
    customId: 'collabDeclineModal',
    async execute(interaction) {
      await interaction.deferReply({ ephemeral: true });

      const collabId = interaction.customId.split(':')[1];
      const reason = interaction.fields.getTextInputValue('reason') || null;

      await pool.query(
        `UPDATE collabs SET status = 'declined', reason = $2, updated_at = NOW() WHERE id = $1 AND status = 'pending'`,
        [collabId, reason]
      );

      await interaction.editReply({ content: `Collab #${collabId} declined${reason ? ': ' + reason : ''}.` });
    }
  }
};
