const pool = require('../db/pool');

module.exports = {
  modal: {
    customId: 'allocationCreate',
    async execute(interaction) {
      await interaction.deferReply({ ephemeral: true });

      const collabId = interaction.customId.split(':')[1];
      const name = interaction.fields.getTextInputValue('name');
      const spotsRaw = interaction.fields.getTextInputValue('spots');
      const deadline = interaction.fields.getTextInputValue('deadline') || null;
      const spots = spotsRaw ? parseInt(spotsRaw, 10) : null;

      await pool.query(
        `INSERT INTO allocations (collab_id, name, spots, deadline)
         VALUES ($1, $2, $3, $4)`,
        [collabId, name, spots, deadline]
      );

      await interaction.editReply({ content: `Allocation **${name}** created for collab ${collabId}.` });
    }
  }
};
