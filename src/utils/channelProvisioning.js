const { ChannelType } = require('discord.js');
const { getAllChannels, setChannelId, PURPOSES } = require('./guildChannels');

const CATEGORY_NAME = '🤝 Collab Bot';

const CHANNEL_DEFS = [
  { purpose: 'requests', name: 'collab-requests', topic: 'Incoming collaboration requests from other servers' },
  { purpose: 'notifications', name: 'collab-notifications', topic: 'Collab accept/decline notifications' },
  { purpose: 'reminders', name: 'collab-reminders', topic: 'Automated raffle/winner/meeting deadline reminders' },
  { purpose: 'audit_log', name: 'collab-audit-log', topic: "Mirror of the bot's audit log" },
];

// Creates whichever of the 4 standard channels aren't already configured
// for this guild, under a shared category. Every step is try/caught
// individually — a missing "Manage Channels" permission (or a channel
// limit, or any other Discord API error) degrades to "skip that one and
// keep going" rather than aborting the whole thing or crashing the bot.
async function provisionDefaultChannels(guild) {
  const existing = await getAllChannels(guild.id);
  const existingPurposes = new Set(existing.map((c) => c.purpose));

  const toCreate = CHANNEL_DEFS.filter((def) => !existingPurposes.has(def.purpose));
  if (!toCreate.length) return { created: [], failed: [], alreadyConfigured: true };

  let category = guild.channels.cache.find((c) => c.type === ChannelType.GuildCategory && c.name === CATEGORY_NAME);
  if (!category) {
    try {
      category = await guild.channels.create({ name: CATEGORY_NAME, type: ChannelType.GuildCategory });
    } catch (err) {
      console.error(`[${guild.name}] Could not create channel category (likely missing Manage Channels permission):`, err.message);
      return { created: [], failed: toCreate.map((d) => d.purpose), alreadyConfigured: false };
    }
  }

  const created = [];
  const failed = [];

  for (const def of toCreate) {
    try {
      let channel = guild.channels.cache.find((c) => c.parentId === category.id && c.name === def.name);
      if (!channel) {
        channel = await guild.channels.create({ name: def.name, type: ChannelType.GuildText, parent: category.id, topic: def.topic });
      }
      await setChannelId(guild.id, def.purpose, channel.id);
      created.push({ purpose: def.purpose, channelId: channel.id, label: PURPOSES[def.purpose].label });
    } catch (err) {
      console.error(`[${guild.name}] Could not create channel for purpose "${def.purpose}":`, err.message);
      failed.push(def.purpose);
    }
  }

  return { created, failed, alreadyConfigured: false };
}

module.exports = { provisionDefaultChannels, CHANNEL_DEFS, CATEGORY_NAME };
