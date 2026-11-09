const pool = require('../db/pool');

async function hasReminderBeenSent(key) {
  const { rows } = await pool.query(`SELECT 1 FROM reminders_sent WHERE reminder_key = $1`, [key]);
  return rows.length > 0;
}

async function markReminderSent(key) {
  await pool.query(`INSERT INTO reminders_sent (reminder_key) VALUES ($1) ON CONFLICT (reminder_key) DO NOTHING`, [key]);
}

module.exports = { hasReminderBeenSent, markReminderSent };
