const pool = require('../db/pool');

function formatDuration(ms) {
  if (ms == null) return 'n/a';
  const hours = ms / 3600000;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

// Response time = time between an allocation being created and that
// community submitting their raffle link for it. Missed deadlines are
// computed against the allocation's (free-text, best-effort-parsed)
// deadline field — see the Phase 2 note on why deadlines are stored as
// text rather than timestamps.
async function getCommunityResponseStats(communityId) {
  const { rows } = await pool.query(
    `SELECT a.created_at AS allocation_created_at, a.deadline, r.created_at AS raffle_created_at
     FROM allocations a
     LEFT JOIN raffles r ON r.collab_id = a.collab_id AND r.community_id = a.community_id
     WHERE a.community_id = $1`,
    [communityId]
  );

  const responseTimes = [];
  let lateSubmissions = 0;
  let currentlyOverdue = 0;
  let deadlinesTracked = 0;
  const now = Date.now();

  for (const row of rows) {
    if (row.raffle_created_at) {
      const rt = new Date(row.raffle_created_at).getTime() - new Date(row.allocation_created_at).getTime();
      if (rt >= 0) responseTimes.push(rt);
    }

    const deadlineMs = row.deadline ? Date.parse(row.deadline) : NaN;
    if (!Number.isNaN(deadlineMs)) {
      deadlinesTracked++;
      if (row.raffle_created_at) {
        if (new Date(row.raffle_created_at).getTime() > deadlineMs) lateSubmissions++;
      } else if (deadlineMs < now) {
        currentlyOverdue++;
      }
    }
  }

  const avgResponseMs = responseTimes.length ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : null;

  return {
    avgResponseMs,
    avgResponseFormatted: formatDuration(avgResponseMs),
    sampleSize: responseTimes.length,
    lateSubmissions,
    currentlyOverdue,
    deadlinesTracked,
  };
}

module.exports = { getCommunityResponseStats, formatDuration };
