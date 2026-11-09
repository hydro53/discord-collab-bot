// Discord modals cap out at 5 text inputs, but a collab request has 11 fields,
// so we collect it across 3 chained modals. Drafts are short-lived (a manager
// fills the whole flow in under a few minutes) so an in-memory Map is fine —
// if you run multiple bot processes/shards, swap this for Redis.

const drafts = new Map();
const DRAFT_TTL_MS = 15 * 60 * 1000; // abandon incomplete drafts after 15 min
const SWEEP_INTERVAL_MS = 10 * 60 * 1000; // periodic cleanup for drafts nobody ever submitted

function createDraft(userId) {
  const draftId = `${userId}-${Date.now()}`;
  drafts.set(draftId, { data: {}, expiresAt: Date.now() + DRAFT_TTL_MS });
  return draftId;
}

function getDraft(draftId) {
  const draft = drafts.get(draftId);
  if (!draft) return null;
  if (Date.now() > draft.expiresAt) {
    drafts.delete(draftId);
    return null;
  }
  return draft.data;
}

function updateDraft(draftId, fields) {
  const draft = drafts.get(draftId);
  if (!draft) return null;
  Object.assign(draft.data, fields);
  draft.expiresAt = Date.now() + DRAFT_TTL_MS;
  return draft.data;
}

function deleteDraft(draftId) {
  drafts.delete(draftId);
}

// Without this, a draft that's started (createDraft) but never completed
// (e.g. the user opens /allocation-create's modal and just closes it)
// would sit in memory forever — getDraft's lazy expiry only fires on read,
// and an abandoned draft is never read again. This periodic sweep is the
// backstop for that case.
setInterval(() => {
  const now = Date.now();
  for (const [id, draft] of drafts.entries()) {
    if (now > draft.expiresAt) drafts.delete(id);
  }
}, SWEEP_INTERVAL_MS).unref();

module.exports = { createDraft, getDraft, updateDraft, deleteDraft };
