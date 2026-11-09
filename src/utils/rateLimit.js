const cooldowns = new Map();

// Returns { onCooldown, remainingMs }. Call once per attempt — if not on
// cooldown, this also starts the cooldown clock for `key`.
function checkCooldown(key, cooldownMs) {
  const last = cooldowns.get(key);
  const now = Date.now();
  if (last && now - last < cooldownMs) {
    return { onCooldown: true, remainingMs: cooldownMs - (now - last) };
  }
  cooldowns.set(key, now);
  return { onCooldown: false, remainingMs: 0 };
}

module.exports = { checkCooldown };
