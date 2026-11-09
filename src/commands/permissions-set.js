const { SlashCommandBuilder } = require('discord.js');
const pool = require('../db/pool');
const { requireTier, TIER_ADMIN } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('permissions-set')
    .setDescription('Set a role as Admin or Collab Manager')
    .addRoleOption(opt => opt.setName('role').setDescription('Role').setRequired(true))
    .addStringOption(opt =>
      opt.setName('tier')
        .setDescription('Tier')
        .setRequired(true)
        .addChoices(
          { name: 'Admin', value: 'admin' },
          { name: 'Collab Manager', value: 'collab_manager' }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!(await requireTier(interaction, TIER_ADMIN, true))) return;

    const role = interaction.options.getRole('role');
    const tier = interaction.options.getString('tier');

    await pool.query(
      `INSERT INTO guild_roles (guild_id, role_id, tier)
       VALUES ($1, $2, $3)
       ON CONFLICT (guild_id, role_id) DO UPDATE SET tier = EXCLUDED.tier`,
      [interaction.guildId, role.id, tier]
    );

    await interaction.editReply({ content: `Role <@&${role.id}> set as ${tier}.` });
  }
};
