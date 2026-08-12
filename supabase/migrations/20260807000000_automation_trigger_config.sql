alter table public.automations
  add column if not exists trigger_config jsonb not null default '{}'::jsonb;
