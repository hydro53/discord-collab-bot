const { PermissionFlagsBits } = require('discord.js');
const pool = require('../db/pool');

const TIER_ADMIN = 'admin';
const TIER_COLLAB_MANAGER = 'collab_manager';

async function getGuildRoles(guildId) {
  const res = await pool.query(
    'SELECT role_id, tier FROM guild_roles WHERE guild_id = $1',
    [guildId]
  );
  return res.rows;
}

async function hasTier(member, tier) {
  if (!member || !member.guild) return false;

  // Discord Manage Server always satisfies both
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;

  const roles = await getGuildRoles(member.guild.id);
  const memberRoleIds = member.roles.cache.map(r => r.id);

  if (tier === TIER_ADMIN) {
    return roles.some(r => r.tier === TIER_ADMIN && memberRoleIds.includes(r.role_id));
  }
  if (tier === TIER_COLLAB_MANAGER) {
    // Admin includes Collab Manager
    return roles.some(r =>
      (r.tier === TIER_ADMIN || r.tier === TIER_COLLAB_MANAGER) &&
      memberRoleIds.includes(r.role_id)
    );
  }
  return false;
}

async function requireTier(interaction, tier, deferred = false) {
  const ok = await hasTier(interaction.member, tier);
  if (!ok) {
    const msg = `You need the ${tier === TIER_ADMIN ? 'Admin' : 'Collab Manager'} role or Manage Server permission.`;
    if (deferred || interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: msg, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
    }
    return false;
  }
  return true;
}

module.exports = { hasTier, requireTier, TIER_ADMIN, TIER_COLLAB_MANAGER };
