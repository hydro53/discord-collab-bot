const { handleAllocationModalSubmit } = require('./allocationModal');
const { handleRaffleModalSubmit } = require('./raffleModal');
const { handleWinnersManualModalSubmit } = require('./winnersManualModal');
const { handleTemplateModalSubmit } = require('./templateModal');
const { handleServerSetupModalSubmit } = require('./serverSetupModal');
const { handleCollabRequestDeclineModal } = require('./collabRequestDeclineModal');

// Top-level router for every modal submission in the bot. Each feature area
// owns its own customId prefix so they can be handled independently.
async function handleModalSubmit(interaction) {
  const prefix = interaction.customId.split(':')[0];

  if (prefix === 'allocModal') {
    await handleAllocationModalSubmit(interaction);
    return;
  }
  if (prefix === 'raffleModal') {
    await handleRaffleModalSubmit(interaction);
    return;
  }
  if (prefix === 'winnersManualModal') {
    await handleWinnersManualModalSubmit(interaction);
    return;
  }
  if (prefix === 'templateModal') {
    await handleTemplateModalSubmit(interaction);
    return;
  }
  if (prefix === 'serverSetupModal') {
    await handleServerSetupModalSubmit(interaction);
    return;
  }
  if (prefix === 'collabReqDeclineModal') {
    await handleCollabRequestDeclineModal(interaction);
    return;
  }
}

module.exports = { handleModalSubmit };
