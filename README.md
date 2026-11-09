# Discord Collab Management Bot

Web3/NFT collab management bot. Removes manual work from collaborations: requests, allocations, raffles, winner wallets, duplicate/Sybil checks, CSV export.

## Stack

- Node.js 18+
- discord.js v14
- PostgreSQL (pg)
- CommonJS
- Only Guilds intent

## Hard rules

- No numeric collab or reputation score
- No fake data — unavailable metrics show "Unavailable"
- Roles: Admin and Collab Manager only (Manage Server satisfies both)
- No web dashboard or project portal

## Setup

1. Copy `.env.example` to `.env` and fill:
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - `DATABASE_URL` (required)
   - Leave `GUILD_ID` blank for global commands

2. Install:
   ```bash
   npm install
   ```

3. Database (local or Neon free):
   - If local Postgres is running: `DATABASE_URL=postgres://postgres:PASSWORD@localhost:5432/postgres`
   - Then:
     ```bash
     npm run migrate
     ```

4. Deploy commands (global):
   ```bash
   npm run deploy
   ```

5. Start:
   ```bash
   npm start
   ```
   Or `npm run start:prod` (migrates then starts).

## Current known issue

If you see `ECONNREFUSED 127.0.0.1:5432`, `DATABASE_URL` is missing or empty in `.env`. Set it and re-run migrate.

On Windows PowerShell use `npm.cmd` if execution policy blocks `npm`.

## After start

In each server:
1. `/server-setup`
2. `/server-init-channels` (creates Collab Bot category + 4 channels if Manage Channels is granted)

## Commands

49 slash commands covering collab requests, management, allocations, raffles, winners, Sybil scan (Alchemy + QuickNode), X analysis (token required), meetings, templates, CRM notes, permissions, audit, and channel routing.

## Notes

- Deadlines are free text (Date.parse best-effort)
- Scheduler is in-process (pauses when bot is off)
- Drafts for multi-step modals are in-memory (15 min TTL)
- Wallet data not encrypted at rest
- Sybil and X features need their API keys and are untested without them

## Push & Deploy

### Push to GitHub (from your machine)

```bash
cd C:\Users\user\Desktop\ROOT   # or wherever you extracted it
git init
git add .
git commit -m "Initial Discord collab bot"
git branch -M main
git remote add origin https://github.com/YOUR_USER/discord-collab-bot.git
git push -u origin main
```

### Railway (recommended once you have a repo)

1. Push the code to GitHub.
2. Create a new project on Railway → Deploy from GitHub.
3. Add a PostgreSQL service and copy its `DATABASE_URL` into the bot service variables.
4. Set the other env vars (`DISCORD_TOKEN`, `CLIENT_ID`, etc.).
5. Railway will run `npm run start:prod` (from railway.json).

### Local only

Keep using the local Postgres or Neon free tier as described above. Hosting is optional.
