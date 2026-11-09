const { SlashCommandBuilder } = require('discord.js');
const pool = require('../db/pool');
const { requireTier, TIER_ADMIN } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('permissions-remove')
    .setDescription('Remove a role from collab permissions')
    .addRoleOption(opt => opt.setName('role').setDescription('Role').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    if (!(await requireTier(interaction, TIER_ADMIN, true))) return;

    const role = interaction.options.getRole('role');
    await pool.query(
      'DELETE FROM guild_roles WHERE guild_id = $1 AND role_id = $2',
      [interaction.guildId, role.id]
    );

    await interaction.editReply({ content: `Role <@&${role.id}> removed from permissions.` });
  }
};
