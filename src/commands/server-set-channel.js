const { SlashCommandBuilder, ChannelType } = require('discord.js');
const pool = require('../db/pool');
const { requireTier, TIER_ADMIN } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server-set-channel')
    .setDescription('Set a channel for a purpose')
    .addStringOption(opt =>
      opt.setName('purpose')
        .setDescription('Purpose')
        .setRequired(true)
        .addChoices(
          { name: 'Requests', value: 'requests' },
          { name: 'Notifications', value: 'notifications' },
          { name: 'Reminders', value: 'reminders' },
          { name: 'Audit Log', value: 'audit_log' }
        )
    )
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('Channel')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!(await requireTier(interaction, TIER_ADMIN, true))) return;

    const purpose = interaction.options.getString('purpose');
    const channel = interaction.options.getChannel('channel');

    await pool.query(
      `INSERT INTO guild_channels (guild_id, purpose, channel_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (guild_id, purpose) DO UPDATE SET channel_id = EXCLUDED.channel_id`,
      [interaction.guildId, purpose, channel.id]
    );

    await interaction.editReply({ content: `Channel <#${channel.id}> set for ${purpose}.` });
  }
};
