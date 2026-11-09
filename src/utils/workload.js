const pool = require('../db/pool');

async function getWorkload(guildId, userId) {
  const { rows: collabRows } = await pool.query(
    `SELECT id FROM collabs WHERE guild_id = $1 AND assigned_manager_id = $2 AND status != 'completed'`,
    [guildId, userId]
  );
  const collabIds = collabRows.map((r) => r.id);

  if (!collabIds.length) {
    return { active: 0, pendingRaffles: 0, winnerSheetsPending: 0, upcomingCalls: 0, overdueTasks: 0 };
  }

  const [{ rows: raffleGap }, { rows: winnerGap }, { rows: meetingRows }, { rows: allocRows }] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS count
       FROM allocations a
       LEFT JOIN raffles r ON r.collab_id = a.collab_id AND r.community_id = a.community_id
       WHERE a.collab_id = ANY($1::int[]) AND r.id IS NULL`,
      [collabIds]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count
       FROM allocations a
       WHERE a.collab_id = ANY($1::int[])
         AND NOT EXISTS (SELECT 1 FROM wallets w WHERE w.collab_id = a.collab_id AND w.community_id = a.community_id)`,
      [collabIds]
    ),
    pool.query(`SELECT scheduled_at FROM meetings WHERE collab_id = ANY($1::int[])`, [collabIds]),
    pool.query(`SELECT deadline, status FROM allocations WHERE collab_id = ANY($1::int[])`, [collabIds]),
  ]);

  const upcomingCalls = meetingRows.filter((m) => {
    const t = Date.parse(m.scheduled_at);
    return !Number.isNaN(t) && t > Date.now();
  }).length;

  const overdueTasks = allocRows.filter((a) => {
    if (a.status === 'completed') return false;
    const t = Date.parse(a.deadline);
    return !Number.isNaN(t) && t < Date.now();
  }).length;

  return {
    active: collabIds.length,
    pendingRaffles: raffleGap[0].count,
    winnerSheetsPending: winnerGap[0].count,
    upcomingCalls,
    overdueTasks,
  };
}

module.exports = { getWorkload };
