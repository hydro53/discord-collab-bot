async function fetchJson(url) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${process.env.X_BEARER_TOKEN}` } });
  const data = await res.json();
  if (!res.ok) {
    const message = data?.detail || data?.title || `X API error (HTTP ${res.status})`;
    throw new Error(message);
  }
  return data;
}

async function getUserByUsername(handleRaw) {
  const handle = handleRaw.replace(/^@/, '').trim();
  const url = `https://api.x.com/2/users/by/username/${encodeURIComponent(handle)}?user.fields=created_at,public_metrics`;
  const data = await fetchJson(url);
  if (!data.data) throw new Error('User not found');
  return data.data; // { id, username, name, created_at, public_metrics: { followers_count, tweet_count, ... } }
}

async function getRecentTweets(userId, maxResults = 25) {
  const url = `https://api.x.com/2/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=created_at,public_metrics&exclude=retweets,replies`;
  const data = await fetchJson(url);
  return data.data || [];
}

module.exports = { getUserByUsername, getRecentTweets };
