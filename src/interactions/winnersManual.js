const pool = require('../db/pool');
const { batchInsertWallets } = require('../utils/walletBatchInsert');

module.exports = {
  modal: {
    customId: 'winnersManual',
    async execute(interaction) {
      await interaction.deferReply({ ephemeral: true });

      const allocationId = interaction.customId.split(':')[1];
      const text = interaction.fields.getTextInputValue('wallets');
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

      const wallets = lines.map(w => ({ wallet: w, chain: 'evm' }));
      const inserted = await batchInsertWallets(allocationId, interaction.guildId, wallets);

      await interaction.editReply({ content: `Inserted ${inserted} wallets for allocation ${allocationId}.` });
    }
  }
};
