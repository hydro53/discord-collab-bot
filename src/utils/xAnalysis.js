const { getUserByUsername, getRecentTweets } = require('./xApi');
const { summarizeTweets } = require('./xMetrics');
const { getCached, setCached } = require('./xAnalysisCache');

const SAMPLE_SIZE = parseInt(process.env.X_ANALYSIS_SAMPLE_SIZE || '25', 10);

async function analyzeHandle(handleRaw) {
  const handle = handleRaw.replace(/^@/, '').trim();

  const cached = await getCached(handle);
  if (cached) {
    return {
      followers: cached.followers,
      tweetCount: cached.tweet_count,
      accountCreatedAt: cached.account_created_at ? new Date(cached.account_created_at) : null,
      postsLast7Days: cached.posts_last_7_days,
      avgLikes: cached.avg_likes != null ? Number(cached.avg_likes) : null,
      avgReplies: cached.avg_replies != null ? Number(cached.avg_replies) : null,
      avgReposts: cached.avg_reposts != null ? Number(cached.avg_reposts) : null,
      avgViews: cached.avg_views != null ? Number(cached.avg_views) : null,
      engagementRate: cached.engagement_rate != null ? Number(cached.engagement_rate) : null,
      sampleSize: cached.sample_size,
      fromCache: true,
    };
  }

  const user = await getUserByUsername(handle);
  const tweets = await getRecentTweets(user.id, SAMPLE_SIZE);
  const summary = summarizeTweets(tweets, user.public_metrics?.followers_count || 0);

  const result = {
    followers: user.public_metrics?.followers_count ?? null,
    tweetCount: user.public_metrics?.tweet_count ?? null,
    accountCreatedAt: user.created_at ? new Date(user.created_at) : null,
    postsLast7Days: summary.postsLast7Days,
    avgLikes: summary.avgLikes,
    avgReplies: summary.avgReplies,
    avgReposts: summary.avgReposts,
    avgViews: summary.avgViews,
    engagementRate: summary.engagementRate,
    sampleSize: summary.sampleSize,
  };

  await setCached(handle, result);
  return { ...result, fromCache: false };
}

module.exports = { analyzeHandle };
