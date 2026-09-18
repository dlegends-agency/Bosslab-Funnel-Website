-- Real scheduled delays for automations: runs can now pause in a 'waiting'
-- state with a resume_at timestamp, and a scheduled edge function
-- (automation-resume) wakes them back up.

alter table public.automation_runs
  drop constraint if exists automation_runs_status_check,
  add constraint automation_runs_status_check
    check (status in ('running', 'waiting', 'completed', 'failed')),
  add column if not exists resume_at timestamptz;

create index if not exists automation_runs_resume_idx
  on public.automation_runs (status, resume_at)
  where status = 'waiting';

-- Enables scheduling the automation-resume edge function via pg_cron +
-- pg_net. The actual `select cron.schedule(...)` call is NOT included here
-- on purpose — it needs your project's service-role key, which must never
-- be committed to a migration file. Run it once yourself in the SQL Editor
-- (see the instructions you were given alongside this migration).
create extension if not exists pg_cron;
create extension if not exists pg_net;
