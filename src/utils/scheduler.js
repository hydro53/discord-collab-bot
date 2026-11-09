const pool = require('../db/pool');
const { hasReminderBeenSent, markReminderSent } = require('./reminderTracking');
const { resolveChannel } = require('./guildChannels');

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // poll every 5 minutes
const DEADLINE_LOOKAHEAD_MS = 24 * 60 * 60 * 1000; // remind once a deadline is within 24h
const MEETING_LOOKAHEAD_MS = 60 * 60 * 1000; // remind once a meeting is within 1h

function startReminderScheduler(client) {
  const run = () => checkAll(client).catch((err) => console.error('Reminder scheduler error:', err));
  run(); // catch anything already due right after startup
  setInterval(run, CHECK_INTERVAL_MS);
}

async function checkAll(client) {
  await checkRaffleReminders(client);
  await checkWinnerSheetReminders(client);
  await checkMeetingReminders(client);
}

async function postToChannel(client, channelId, content) {
  if (!channelId) return;
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel) return;
  await channel.send(content).catch((err) => console.error('Failed to send reminder:', err));
}

// Deadlines are free text (see Phase 2 design note), so this is best-effort:
// unparseable strings are silently skipped rather than spamming errors.
function isDueSoon(deadlineText, lookaheadMs) {
  const parsed = Date.parse(deadlineText);
  if (Number.isNaN(parsed)) return false;
  const now = Date.now();
  return parsed >= now && parsed - now <= lookaheadMs;
}

async function checkRaffleReminders(client) {
  const { rows } = await pool.query(
    `SELECT a.id, a.community_name_snapshot, a.deadline, c.guild_id, c.channel_id, c.project_name
     FROM allocations a
     JOIN collabs c ON c.id = a.collab_id
     LEFT JOIN raffles r ON r.collab_id = a.collab_id AND r.community_id = a.community_id
     WHERE r.id IS NULL AND a.deadline IS NOT NULL`
  );

  for (const row of rows) {
    if (!isDueSoon(row.deadline, DEADLINE_LOOKAHEAD_MS)) continue;
    const key = `raffle:${row.id}`;
    if (await hasReminderBeenSent(key)) continue;

    const channelId = await resolveChannel(row.guild_id, 'reminders', row.channel_id);
    await postToChannel(
      client,
      channelId,
      `⚠️ **Raffle link reminder — ${row.project_name}**\n**${row.community_name_snapshot}** hasn't submitted their raffle link yet. Deadline: ${row.deadline}`
    );
    await markReminderSent(key);
  }
}

async function checkWinnerSheetReminders(client) {
  const { rows } = await pool.query(
    `SELECT a.id, a.community_name_snapshot, a.deadline, c.guild_id, c.channel_id, c.project_name
     FROM allocations a
     JOIN collabs c ON c.id = a.collab_id
     WHERE a.deadline IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM wallets w WHERE w.collab_id = a.collab_id AND w.community_id = a.community_id)`
  );

  for (const row of rows) {
    if (!isDueSoon(row.deadline, DEADLINE_LOOKAHEAD_MS)) continue;
    const key = `winners:${row.id}`;
    if (await hasReminderBeenSent(key)) continue;

    const channelId = await resolveChannel(row.guild_id, 'reminders', row.channel_id);
    await postToChannel(
      client,
      channelId,
      `⚠️ **Winner sheet reminder — ${row.project_name}**\n**${row.community_name_snapshot}** hasn't submitted their winner wallets yet. Deadline: ${row.deadline}`
    );
    await markReminderSent(key);
  }
}

async function checkMeetingReminders(client) {
  const { rows } = await pool.query(
    `SELECT id, title, scheduled_at, meeting_link, guild_id, channel_id FROM meetings WHERE scheduled_at IS NOT NULL`
  );

  for (const row of rows) {
    if (!isDueSoon(row.scheduled_at, MEETING_LOOKAHEAD_MS)) continue;
    const key = `meeting:${row.id}`;
    if (await hasReminderBeenSent(key)) continue;

    const { rows: goingRows } = await pool.query(`SELECT user_id FROM meeting_rsvps WHERE meeting_id = $1 AND status = 'going'`, [
      row.id,
    ]);
    const pings = goingRows.map((r) => `<@${r.user_id}>`).join(' ');

    const channelId = await resolveChannel(row.guild_id, 'reminders', row.channel_id);
    await postToChannel(
      client,
      channelId,
      `⏰ **Meeting starting soon: ${row.title}**\nWhen: ${row.scheduled_at}${row.meeting_link ? `\nLink: ${row.meeting_link}` : ''}\n${pings}`
    );
    await markReminderSent(key);
  }
}

module.exports = { startReminderScheduler };
