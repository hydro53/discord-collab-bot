const { SlashCommandBuilder } = require('discord.js');
const pool = require('../db/pool');
const { requireTier, TIER_ADMIN } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-init-channels')
    .setDescription('Create or recreate the Collab Bot category and channels'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!(await requireTier(interaction, TIER_ADMIN, true))) return;

    const guild = interaction.guild;
    const me = guild.members.me;
    if (!me || !me.permissions.has('ManageChannels')) {
      return interaction.editReply({ content: 'Bot needs Manage Channels permission.' });
    }

    let category = guild.channels.cache.find(c => c.name === 'Collab Bot' && c.type === 4);
    if (!category) {
      category = await guild.channels.create({ name: 'Collab Bot', type: 4 });
    }

    const purposes = [
      { name: 'collab-requests', purpose: 'requests' },
      { name: 'collab-notifications', purpose: 'notifications' },
      { name: 'collab-reminders', purpose: 'reminders' },
      { name: 'collab-audit', purpose: 'audit_log' }
    ];

    const created = [];
    for (const p of purposes) {
      let channel = guild.channels.cache.find(c => c.name === p.name && c.parentId === category.id);
      if (!channel) {
        channel = await guild.channels.create({
          name: p.name,
          type: 0,
          parent: category.id
        });
      }
      await pool.query(
        `INSERT INTO guild_channels (guild_id, purpose, channel_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (guild_id, purpose) DO UPDATE SET channel_id = EXCLUDED.channel_id`,
        [guild.id, p.purpose, channel.id]
      );
      created.push(`<#${channel.id}>`);
    }

    await interaction.editReply({ content: `Channels ready: ${created.join(', ')}` });
  }
};
