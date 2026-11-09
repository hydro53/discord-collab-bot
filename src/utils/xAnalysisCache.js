const pool = require('../db/pool');

const CACHE_HOURS = parseInt(process.env.X_ANALYSIS_CACHE_HOURS || '6', 10);

async function getCached(handle) {
  const { rows } = await pool.query(`SELECT * FROM x_analysis_cache WHERE handle = $1`, [handle.toLowerCase()]);
  if (!rows.length) return null;

  const ageMs = Date.now() - new Date(rows[0].fetched_at).getTime();
  if (ageMs > CACHE_HOURS * 3600 * 1000) return null;

  return rows[0];
}

async function setCached(handle, data) {
  await pool.query(
    `INSERT INTO x_analysis_cache (
       handle, followers, tweet_count, account_created_at, posts_last_7_days,
       avg_likes, avg_replies, avg_reposts, avg_views, engagement_rate, sample_size, fetched_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now())
     ON CONFLICT (handle) DO UPDATE SET
       followers = EXCLUDED.followers, tweet_count = EXCLUDED.tweet_count,
       account_created_at = EXCLUDED.account_created_at, posts_last_7_days = EXCLUDED.posts_last_7_days,
       avg_likes = EXCLUDED.avg_likes, avg_replies = EXCLUDED.avg_replies, avg_reposts = EXCLUDED.avg_reposts,
       avg_views = EXCLUDED.avg_views, engagement_rate = EXCLUDED.engagement_rate,
       sample_size = EXCLUDED.sample_size, fetched_at = now()`,
    [
      handle.toLowerCase(),
      data.followers,
      data.tweetCount,
      data.accountCreatedAt,
      data.postsLast7Days,
      data.avgLikes,
      data.avgReplies,
      data.avgReposts,
      data.avgViews,
      data.engagementRate,
      data.sampleSize,
    ]
  );
}

module.exports = { getCached, setCached, CACHE_HOURS };
