async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function runNext() {
    while (cursor < items.length) {
      const current = cursor++;
      results[current] = await worker(items[current], current);
    }
  }

  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, runNext);
  await Promise.all(workers);
  return results;
}

module.exports = { runWithConcurrency };
