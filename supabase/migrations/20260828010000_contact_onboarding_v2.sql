alter table public.contacts
  add column if not exists business_website text not null default '',
  add column if not exists business_location text not null default '',
  add column if not exists business_goals text[] not null default '{}',
  add column if not exists onboarding_step smallint not null default 0;
