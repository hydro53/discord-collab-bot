-- Idempotent schema for Discord Collab Bot
-- Uses DO blocks for types that lack IF NOT EXISTS

DO $$ BEGIN
  CREATE TYPE collab_status AS ENUM ('pending', 'accepted', 'declined', 'active', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE allocation_status AS ENUM ('open', 'closed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE raffle_status AS ENUM ('pending', 'submitted', 'reminded', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE meeting_response AS ENUM ('going', 'cant_make_it', 'suggest_another');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE visibility AS ENUM ('public', 'private', 'hidden');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE role_tier AS ENUM ('admin', 'collab_manager');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE channel_purpose AS ENUM ('requests', 'notifications', 'reminders', 'audit_log');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS guilds (
  guild_id TEXT PRIMARY KEY,
  name TEXT,
  server_type TEXT DEFAULT 'Both', -- Project, Community, Both
  x_handle TEXT,
  website TEXT,
  discord_invite TEXT,
  chains TEXT,
  visibility visibility DEFAULT 'public',
  accepting_collabs BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (for existing DBs)
DO $$ BEGIN
  ALTER TABLE guilds ADD COLUMN IF NOT EXISTS server_type TEXT DEFAULT 'Both';
  ALTER TABLE guilds ADD COLUMN IF NOT EXISTS x_handle TEXT;
  ALTER TABLE guilds ADD COLUMN IF NOT EXISTS website TEXT;
  ALTER TABLE guilds ADD COLUMN IF NOT EXISTS discord_invite TEXT;
  ALTER TABLE guilds ADD COLUMN IF NOT EXISTS chains TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Store request message so we can edit it on accept/decline
DO $$ BEGIN
  ALTER TABLE collabs ADD COLUMN IF NOT EXISTS request_message_id TEXT;
  ALTER TABLE collabs ADD COLUMN IF NOT EXISTS request_channel_id TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS guild_roles (
  guild_id TEXT REFERENCES guilds(guild_id) ON DELETE CASCADE,
  role_id TEXT,
  tier role_tier,
  PRIMARY KEY (guild_id, role_id)
);

CREATE TABLE IF NOT EXISTS guild_channels (
  guild_id TEXT REFERENCES guilds(guild_id) ON DELETE CASCADE,
  purpose channel_purpose,
  channel_id TEXT,
  PRIMARY KEY (guild_id, purpose)
);

CREATE TABLE IF NOT EXISTS blocked_guilds (
  blocker_guild_id TEXT REFERENCES guilds(guild_id) ON DELETE CASCADE,
  blocked_guild_id TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_guild_id, blocked_guild_id)
);

CREATE TABLE IF NOT EXISTS collabs (
  id SERIAL PRIMARY KEY,
  requester_guild_id TEXT REFERENCES guilds(guild_id),
  target_guild_id TEXT REFERENCES guilds(guild_id),
  status collab_status DEFAULT 'pending',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (requester_guild_id, target_guild_id)
);

CREATE TABLE IF NOT EXISTS collab_tasks (
  id SERIAL PRIMARY KEY,
  collab_id INTEGER REFERENCES collabs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS allocations (
  id SERIAL PRIMARY KEY,
  collab_id INTEGER REFERENCES collabs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  spots INTEGER,
  deadline TEXT, -- free text
  status allocation_status DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raffles (
  id SERIAL PRIMARY KEY,
  allocation_id INTEGER REFERENCES allocations(id) ON DELETE CASCADE,
  guild_id TEXT,
  link TEXT,
  status raffle_status DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS winners (
  id SERIAL PRIMARY KEY,
  allocation_id INTEGER REFERENCES allocations(id) ON DELETE CASCADE,
  guild_id TEXT,
  wallet TEXT NOT NULL,
  chain TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  is_duplicate BOOLEAN DEFAULT false,
  sybil_flags JSONB,
  sybil_reasons TEXT[]
);

CREATE TABLE IF NOT EXISTS meetings (
  id SERIAL PRIMARY KEY,
  collab_id INTEGER REFERENCES collabs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  time TEXT, -- free text, parseable if possible
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meeting_responses (
  meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,
  user_id TEXT,
  guild_id TEXT,
  response meeting_response,
  suggestion TEXT,
  PRIMARY KEY (meeting_id, user_id)
);

CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  guild_id TEXT REFERENCES guilds(guild_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_notes (
  id SERIAL PRIMARY KEY,
  guild_id TEXT REFERENCES guilds(guild_id) ON DELETE CASCADE,
  note TEXT,
  response_time TEXT,
  missed_deadlines INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminders_sent (
  id SERIAL PRIMARY KEY,
  type TEXT, -- raffle, winner, meeting
  reference_id TEXT,
  guild_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (type, reference_id, guild_id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  guild_id TEXT,
  user_id TEXT,
  action TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS x_analysis_cache (
  handle TEXT PRIMARY KEY,
  data JSONB,
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collabs_requester ON collabs(requester_guild_id);
CREATE INDEX IF NOT EXISTS idx_collabs_target ON collabs(target_guild_id);
CREATE INDEX IF NOT EXISTS idx_winners_wallet ON winners(wallet);
CREATE INDEX IF NOT EXISTS idx_winners_allocation ON winners(allocation_id);
CREATE INDEX IF NOT EXISTS idx_audit_guild ON audit_log(guild_id, created_at DESC);
