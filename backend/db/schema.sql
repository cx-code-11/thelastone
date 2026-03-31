-- ============================================================
-- multitenant-todo PostgreSQL schema
-- Run once: psql -U <user> -d <dbname> -f schema.sql
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- for gen_random_uuid()

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  password    TEXT        NOT NULL,                -- bcrypt hash
  role        TEXT        NOT NULL DEFAULT 'member'
                          CHECK (role IN ('admin','team-head','member','client')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Teams ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  created_by  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Team Members (join table) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, user_id)
);

-- ─── Tasks ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT        NOT NULL,
  description     TEXT        NOT NULL DEFAULT '',
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','in-progress','completed')),
  priority        TEXT        NOT NULL DEFAULT 'medium'
                              CHECK (priority IN ('low','medium','high')),
  assignment_type TEXT        NOT NULL DEFAULT 'self'
                              CHECK (assignment_type IN ('user','team','self')),
  assigned_to     UUID        REFERENCES users(id) ON DELETE SET NULL,
  assigned_team   UUID        REFERENCES teams(id) ON DELETE SET NULL,
  created_by      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to   ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_team ON tasks(assigned_team);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by    ON tasks(created_by);

-- ─── Auto-update updated_at ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_updated_at') THEN
    CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'teams_updated_at') THEN
    CREATE TRIGGER teams_updated_at BEFORE UPDATE ON teams
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tasks_updated_at') THEN
    CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
