-- Full base schema for a fresh Supabase project.
-- The original tables were created directly in the Supabase dashboard and
-- were never captured in a migration; this file reconstructs them so a new
-- project can be bootstrapped from the SQL Editor in one pass. Later
-- migrations in this folder apply on top of this one.

create extension if not exists pgcrypto;

-- ——— contacts ———
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  first_name text not null default '',
  last_name text not null default '',
  email text not null unique,
  phone text not null default '',
  status text not null default 'subscribed'
    check (status in ('subscribed', 'unsubscribed', 'bounced')),
  order_plan text,
  total_revenue numeric not null default 0,
  notes text not null default '',
  timezone text not null default '',
  address text not null default '',
  company text not null default '',
  gender text not null default '',
  date_of_birth text not null default '',
  business_niche text not null default '',
  business_goal text not null default '',
  business_website text not null default '',
  business_location text not null default '',
  business_goals text[] not null default '{}',
  onboarding_step smallint not null default 0,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ——— lists & tags ———
create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_lists (
  contact_id uuid not null references public.contacts (id) on delete cascade,
  list_id uuid not null references public.lists (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (contact_id, list_id)
);

create table if not exists public.contact_tags (
  contact_id uuid not null references public.contacts (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (contact_id, tag_id)
);

-- ——— automations ———
create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trigger_type text not null default 'unset'
    check (trigger_type in (
      'unset', 'form_submit', 'stripe_purchase', 'order_created',
      'order_created_per_product', 'tag_added', 'tag_removed',
      'added_to_list', 'removed_from_list', 'contact_subscribes',
      'contact_unsubscribes', 'webhook_received'
    )),
  trigger_config jsonb not null default '{}'::jsonb,
  status text not null default 'inactive' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_steps (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations (id) on delete cascade,
  position int not null default 0,
  step_type text not null
    check (step_type in ('action', 'delay', 'condition', 'split_path', 'goal', 'jump', 'exit')),
  action_type text
    check (action_type in ('add_to_list', 'remove_from_list', 'add_tag', 'remove_tag', 'zapier_webhook', 'send_email')),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations (id) on delete cascade,
  contact_id uuid not null references public.contacts (id) on delete cascade,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  current_step int not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.automation_run_logs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.automation_runs (id) on delete cascade,
  step_id uuid references public.automation_steps (id) on delete set null,
  status text not null check (status in ('success', 'failed')),
  message text not null default '',
  created_at timestamptz not null default now()
);

-- ——— site settings (pixel tracking config, etc.) ———
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value)
values (
  'pixel_tracking',
  '{
    "facebook": {
      "pixel_id": "",
      "enable_page_view": true,
      "enable_view_content": true,
      "enable_lead": true,
      "enable_add_to_cart": true,
      "enable_purchase": true
    },
    "google_analytics": {
      "measurement_id": "",
      "enable_page_view": true,
      "enable_lead": true,
      "enable_purchase": true
    },
    "google_ads": {
      "conversion_id": "",
      "purchase_label": "",
      "lead_label": "",
      "enable_page_view": true,
      "enable_lead": true,
      "enable_purchase": true
    }
  }'::jsonb
)
on conflict (key) do nothing;

-- ——— indexes ———
create index if not exists contact_lists_list_id_idx on public.contact_lists (list_id);
create index if not exists contact_tags_tag_id_idx on public.contact_tags (tag_id);
create index if not exists automation_steps_automation_id_idx on public.automation_steps (automation_id, position);
create index if not exists automation_runs_automation_id_idx on public.automation_runs (automation_id);
create index if not exists automation_runs_contact_id_idx on public.automation_runs (contact_id);
create index if not exists automation_run_logs_run_id_idx on public.automation_run_logs (run_id);

-- ——— RLS ———
-- This app calls Supabase directly from the browser with the publishable
-- (anon) key for both reads and writes — there is no separate server-side
-- auth layer — so every table gets a permissive anon+authenticated policy,
-- matching the pattern already used for site_settings.
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'contacts', 'lists', 'tags', 'contact_lists', 'contact_tags',
      'automations', 'automation_steps', 'automation_runs', 'automation_run_logs',
      'site_settings'
    ])
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "Allow anon all %I" on public.%I;', t, t);
    execute format(
      'create policy "Allow anon all %I" on public.%I for all to anon, authenticated using (true) with check (true);',
      t, t
    );
  end loop;
end $$;
