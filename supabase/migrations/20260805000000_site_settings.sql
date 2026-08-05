-- Pixel tracking settings (applied remotely via Supabase MCP)
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "Allow anon read site_settings" on public.site_settings;
drop policy if exists "Allow anon write site_settings" on public.site_settings;

create policy "Allow anon read site_settings"
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

create policy "Allow anon write site_settings"
  on public.site_settings
  for all
  to anon, authenticated
  using (true)
  with check (true);

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
