require('dotenv').config();
const { Client, GatewayIntentBits, Events, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const pool = require('./db/pool');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

// Load interactions
const interactionsPath = path.join(__dirname, 'interactions');
const interactionFiles = fs.existsSync(interactionsPath)
  ? fs.readdirSync(interactionsPath).filter(f => f.endsWith('.js'))
  : [];
const buttonHandlers = new Map();
const modalHandlers = new Map();
const autocompleteHandlers = new Map();

for (const file of interactionFiles) {
  const mod = require(path.join(interactionsPath, file));
  if (mod.button) buttonHandlers.set(mod.button.customId, mod.button);
  if (mod.modal) modalHandlers.set(mod.modal.customId, mod.modal);
  if (mod.autocomplete) autocompleteHandlers.set(mod.autocomplete.name, mod.autocomplete);
}

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
  startScheduler(client);
});

client.on(Events.GuildCreate, async (guild) => {
  console.log(`Joined guild: ${guild.name} (${guild.id})`);
  try {
    await pool.query(
      `INSERT INTO guilds (guild_id, name) VALUES ($1, $2)
       ON CONFLICT (guild_id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()`,
      [guild.id, guild.name]
    );
    // Auto-create channels if possible
    await ensureCollabChannels(guild);
  } catch (err) {
    console.error('Error on guild join:', err);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction, client);
    } else if (interaction.isButton()) {
      const handler = buttonHandlers.get(interaction.customId.split(':')[0]) ||
                      buttonHandlers.get(interaction.customId);
      if (handler) await handler.execute(interaction, client);
    } else if (interaction.isModalSubmit()) {
      const handler = modalHandlers.get(interaction.customId.split(':')[0]) ||
                      modalHandlers.get(interaction.customId);
      if (handler) await handler.execute(interaction, client);
    } else if (interaction.isAutocomplete()) {
      const handler = autocompleteHandlers.get(interaction.commandName);
      if (handler) await handler.execute(interaction, client);
    }
  } catch (err) {
    console.error('Interaction error:', err);
    // Autocomplete cannot use reply/editReply
    if (interaction.isAutocomplete()) return;

    const reply = { content: 'An error occurred while processing this interaction.', flags: 64 };
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(reply);
      } else if (interaction.isRepliable()) {
        await interaction.reply(reply);
      }
    } catch (e) {
      console.error('Failed to send error reply:', e.message);
    }
  }
});

async function ensureCollabChannels(guild) {
  const me = guild.members.me;
  if (!me || !me.permissions.has('ManageChannels')) return;

  let category = guild.channels.cache.find(c => c.name === 'Collab Bot' && c.type === 4);
  if (!category) {
    category = await guild.channels.create({
      name: 'Collab Bot',
      type: 4
    }).catch(() => null);
  }
  if (!category) return;

  const purposes = [
    { name: 'collab-requests', purpose: 'requests' },
    { name: 'collab-notifications', purpose: 'notifications' },
    { name: 'collab-reminders', purpose: 'reminders' },
    { name: 'collab-audit', purpose: 'audit_log' }
  ];

  for (const p of purposes) {
    let channel = guild.channels.cache.find(c => c.name === p.name && c.parentId === category.id);
    if (!channel) {
      channel = await guild.channels.create({
        name: p.name,
        type: 0,
        parent: category.id
      }).catch(() => null);
    }
    if (channel) {
      await pool.query(
        `INSERT INTO guild_channels (guild_id, purpose, channel_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (guild_id, purpose) DO UPDATE SET channel_id = EXCLUDED.channel_id`,
        [guild.id, p.purpose, channel.id]
      );
    }
  }
}

function startScheduler(client) {
  setInterval(async () => {
    try {
      await checkReminders(client);
    } catch (err) {
      console.error('Scheduler error:', err);
    }
  }, 5 * 60 * 1000); // every 5 minutes
}

async function checkReminders(client) {
  // Raffle and winner deadlines within 24h, meetings within 1h
  // Dedup via reminders_sent
  // Implementation placeholder - expand based on free-text Date.parse
  const now = new Date();
  // ... query allocations, meetings, etc. and send once
  console.log('Scheduler tick at', now.toISOString());
}

client.login(process.env.DISCORD_TOKEN);
