require('dotenv').config();
const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  const guildId = process.env.GUILD_ID;
  if (!guildId) {
    console.log('No GUILD_ID set. Skipping guild command clear.');
    return;
  }
  try {
    console.log(`Clearing guild commands for ${guildId}...`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
      { body: [] }
    );
    console.log('Guild commands cleared.');
  } catch (error) {
    console.error(error);
  }
})();
