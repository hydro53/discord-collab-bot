function summarizeTweets(tweets, followers) {
  if (!tweets.length) {
    return { postsLast7Days: 0, avgLikes: null, avgReplies: null, avgReposts: null, avgViews: null, engagementRate: null, sampleSize: 0 };
  }

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const postsLast7Days = tweets.filter((t) => new Date(t.created_at).getTime() >= sevenDaysAgo).length;

  let likes = 0;
  let replies = 0;
  let reposts = 0;
  let views = 0;
  let viewsFieldPresent = false;

  for (const t of tweets) {
    const m = t.public_metrics || {};
    likes += m.like_count || 0;
    replies += m.reply_count || 0;
    reposts += (m.retweet_count || 0) + (m.quote_count || 0);
    if (m.impression_count !== undefined) {
      viewsFieldPresent = true;
      views += m.impression_count;
    }
  }

  const n = tweets.length;
  const avgLikes = likes / n;
  const avgReplies = replies / n;
  const avgReposts = reposts / n;
  const avgViews = viewsFieldPresent ? views / n : null;

  const engagementRate = followers > 0 ? ((avgLikes + avgReplies + avgReposts) / followers) * 100 : null;

  return { postsLast7Days, avgLikes, avgReplies, avgReposts, avgViews, engagementRate, sampleSize: n };
}

module.exports = { summarizeTweets };
