alter table public.contacts
  add column if not exists business_niche text not null default '',
  add column if not exists business_goal text not null default '',
  add column if not exists onboarded_at timestamptz;
