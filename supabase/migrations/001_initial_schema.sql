-- ABIBAT Portfolio — PostgreSQL Schema & Row Level Security
-- Supabase handles Auth, Content, Portfolio, Experience, Representation,
-- Hero Slideshows, Inquiries, and Cloudinary Media Asset Metadata.

create extension if not exists "pgcrypto";

-- 1. Admin profiles & authorization helper
create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from public.admin_profiles
    where id = auth.uid()
  );
$$;

-- 2. Central Media Library (Cloudinary Asset Metadata)
-- Primary key uses text to seamlessly support both UUIDs and studio asset slugs (e.g. 'asset-hero-home-1')
create table if not exists public.media_assets (
  id text primary key default gen_random_uuid()::text,
  asset_name text not null,
  cloudinary_public_id text not null unique,
  cloudinary_asset_id text,
  secure_url text not null,
  resource_type text not null default 'image',
  format text,
  width integer,
  height integer,
  file_size integer,
  alt_text text not null default '',
  folder text not null default 'abibat/general',
  tags text[] not null default '{}',
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Independent Hero Slideshows (one per public route)
create table if not exists public.page_heroes (
  id text primary key default gen_random_uuid()::text,
  page_slug text not null unique check (
    page_slug in ('home', 'portfolio', 'digitals', 'about', 'experience', 'representation', 'contact')
  ),
  kicker text not null default '',
  title text not null default '',
  subtitle text not null default '',
  cta_text text not null default '',
  cta_link text not null default '',
  slides jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 4. Homepage Settings & Section Visibility
create table if not exists public.homepage_settings (
  id text primary key default 'default',
  wordmark text not null default 'ABIBAT',
  hero_side_caption text not null default 'MORE THAN A MODEL',
  selected_work_kicker text not null default '01',
  selected_work_title text not null default 'SELECTED WORK',
  selected_work_description text not null default 'A curated selection of editorial, campaigns and creative collaborations from around the world.',
  selected_work_cta_text text not null default 'VIEW PORTFOLIO',
  selected_work_cta_link text not null default '/portfolio',
  about_kicker text not null default 'ABOUT',
  about_title text not null default 'DEDICATED TO THE CRAFT.',
  about_paragraphs jsonb not null default '[]'::jsonb,
  about_quote text not null default '',
  about_cta_text text not null default 'LEARN MORE',
  about_cta_link text not null default '/about',
  about_portrait_asset_id text references public.media_assets(id) on delete set null,
  about_inset_asset_id text references public.media_assets(id) on delete set null,
  model_stats jsonb not null default '{}'::jsonb,
  digitals_kicker text not null default '03',
  digitals_title text not null default 'DIGITALS',
  digitals_subtitle text not null default 'Natural. Raw. Real.',
  digitals_description text not null default 'A collection of unretouched digitals showcasing my natural look, structure and versatility.',
  digitals_cta_text text not null default 'VIEW ALL DIGITALS',
  digitals_cta_link text not null default '/digitals',
  digitals_feature_asset_id text references public.media_assets(id) on delete set null,
  experience_kicker text not null default '04',
  experience_title text not null default 'EXPERIENCE',
  experience_description text not null default 'Selected work from my journey in fashion and beyond.',
  experience_cta_text text not null default 'VIEW ALL EXPERIENCE',
  experience_cta_link text not null default '/experience',
  experience_feature_asset_id text references public.media_assets(id) on delete set null,
  representation_kicker text not null default '05',
  representation_title text not null default 'REPRESENTATION',
  representation_description text not null default 'Agencies I''m currently represented by.',
  representation_cta_text text not null default 'VIEW REPRESENTATION',
  representation_cta_link text not null default '/representation',
  representation_feature_asset_id text references public.media_assets(id) on delete set null,
  contact_kicker text not null default '06 — FOR BOOKINGS & PROFESSIONAL INQUIRIES',
  contact_title text not null default 'LET''S WORK TOGETHER.',
  contact_description text not null default 'Whether you''re an agency, brand, photographer, designer or production team — I''d love to hear from you.',
  contact_cta_text text not null default 'GET IN TOUCH',
  contact_cta_link text not null default '/contact',
  contact_backdrop_asset_id text references public.media_assets(id) on delete set null,
  section_visibility jsonb not null default '{"hero":true,"selectedWork":true,"about":true,"digitals":true,"experienceRepresentation":true,"contact":true}'::jsonb,
  featured_project_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 5. Portfolio Projects
create table if not exists public.portfolio_projects (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  season text not null default '',
  category text not null check (category in ('Campaigns', 'Editorials', 'Runway', 'Publications', 'Collaborations')),
  location text not null default '',
  year text not null default '',
  client text not null default '',
  photographer text not null default '',
  external_link text not null default '',
  description text not null default '',
  credits text not null default '',
  cover_asset_id text references public.media_assets(id) on delete set null,
  gallery_asset_ids jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  is_placeholder boolean not null default true,
  created_at timestamptz not null default now()
);

-- 6. Digitals Items
create table if not exists public.digitals_items (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  angle text not null default 'Front Portrait',
  notes text not null default '',
  asset_id text references public.media_assets(id) on delete set null,
  is_bw boolean not null default false,
  sort_order integer not null default 0,
  is_placeholder boolean not null default true,
  created_at timestamptz not null default now()
);

-- 7. Experience Entries
create table if not exists public.experience_entries (
  id text primary key default gen_random_uuid()::text,
  year text not null,
  season text not null default '',
  category text not null check (category in ('Campaigns', 'Runway', 'Editorials', 'Publications', 'Collaborations')),
  title text not null,
  client_or_publication text not null,
  location text not null default '',
  notes text not null default '',
  description text not null default '',
  cover_asset_id text references public.media_assets(id) on delete set null,
  gallery_asset_ids jsonb not null default '[]'::jsonb,
  external_link text not null default '',
  featured boolean not null default false,
  featured_on_home boolean not null default true,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  is_placeholder boolean not null default true,
  created_at timestamptz not null default now()
);

-- 8. Representation Agencies
create table if not exists public.representation_agencies (
  id text primary key default gen_random_uuid()::text,
  city text not null,
  country text not null default '',
  agency_name text not null default '',
  agent_name text not null default '',
  email text not null default '',
  phone text not null default '',
  website text not null default '',
  address text not null default '',
  description text not null default '',
  logo_asset_id text references public.media_assets(id) on delete set null,
  photo_asset_id text references public.media_assets(id) on delete set null,
  specialties text[] not null default '{}',
  status_note text not null default 'Placement details editable via Admin',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_placeholder boolean not null default false,
  created_at timestamptz not null default now()
);

-- 9. Contact Inquiries
create table if not exists public.contact_inquiries (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  email text not null,
  organization text not null default '',
  inquiry_type text not null default 'Editorial Booking',
  location text not null default '',
  dates text not null default '',
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  created_at timestamptz not null default now()
);

-- 10. Site Settings
create table if not exists public.site_settings (
  id text primary key default 'default',
  email text not null default 'eletuabibat12@gmail.com',
  phone text not null default '08076020513',
  instagram_primary text not null default '@eletuabibat_',
  instagram_secondary text not null default '@_theeletuabibat',
  regions_line text not null default 'Lagos · Paris · Milan · Spain',
  copyright_text text not null default '© 2025 ABIBAT. All rights reserved.',
  updated_at timestamptz not null default now()
);

-- 11. About Page Settings
create table if not exists public.about_page_settings (
  id text primary key default 'default',
  hero_corner_caption text not null default 'MORE THAN JUST A MODEL',
  story_kicker text not null default 'MY STORY',
  story_title text not null default 'FROM LAGOS TO THE WORLD.',
  story_paragraphs jsonb not null default '[]'::jsonb,
  quick_facts_title text not null default 'QUICK FACTS',
  quick_facts_quote text not null default '',
  values_title text not null default 'MY VALUES',
  values_items jsonb not null default '[]'::jsonb,
  drives_kicker text not null default 'WHAT DRIVES ME',
  drives_title text not null default 'PASSION. DISCIPLINE. GROWTH.',
  drives_paragraphs jsonb not null default '[]'::jsonb,
  big_picture_kicker text not null default 'THE BIG PICTURE',
  big_picture_title text not null default 'MORE THAN A MODEL',
  big_picture_paragraphs jsonb not null default '[]'::jsonb,
  big_picture_cta_text text not null default 'VIEW MY PORTFOLIO',
  big_picture_cta_link text not null default '/portfolio',
  big_picture_handwritten_note text not null default 'Same girl, bigger dreams.',
  story_portrait_asset_id text references public.media_assets(id) on delete set null,
  drives_backdrop_asset_id text references public.media_assets(id) on delete set null,
  big_picture_left_asset_id text references public.media_assets(id) on delete set null,
  big_picture_top_right_asset_id text references public.media_assets(id) on delete set null,
  big_picture_bottom_right_asset_id text references public.media_assets(id) on delete set null,
  story_layout_order text not null default 'text-portrait-facts',
  big_picture_layout_order text not null default 'portrait-text-collage',
  updated_at timestamptz not null default now()
);

-- 12. Digitals Page Settings & Optional Model Measurements
create table if not exists public.digitals_page_settings (
  id text primary key default 'default',
  hero_corner_caption text not null default 'NATURAL BEAUTY. TIMELESS PRESENCE.',
  about_kicker text not null default 'ABOUT ME',
  about_name text not null default 'ABIBAT',
  about_bio text not null default 'A model with presence, versatility and a natural elegance. My digitals showcase who I am — no filters, just real me.',
  quote text not null default '“Discipline turns dreams into opportunities.”',
  book_cta_text text not null default 'BOOK ABIBAT',
  book_cta_link text not null default '/contact',
  bust text not null default '',
  waist text not null default '',
  hips text not null default '',
  shoe_size text not null default '',
  hair text not null default '',
  eyes text not null default '',
  comp_card_pdf_url text not null default '',
  comp_card_pdf_name text not null default '',
  comp_card_pdf_public_id text not null default '',
  updated_at timestamptz not null default now()
);

-- 13. Representation Page Settings
create table if not exists public.representation_page_settings (
  id text primary key default 'default',
  hero_corner_caption text not null default 'TOP AGENCIES. GLOBAL OPPORTUNITIES.',
  section_kicker text not null default 'REPRESENTED BY',
  section_title text not null default 'OUR AGENCIES',
  section_description text not null default 'ABIBAT is currently represented by the following agencies. Each agency plays a key role in placing her in top fashion, commercial and editorial projects worldwide.',
  bottom_cta_kicker text not null default 'WANT TO REPRESENT ABIBAT?',
  bottom_cta_title text not null default 'LET''S BUILD SOMETHING BIG.',
  bottom_cta_description text not null default 'For agency inquiries, brand partnerships or collaboration opportunities, get in touch with our team.',
  bottom_cta_text text not null default 'CONTACT US',
  bottom_cta_link text not null default '/contact?inquiryType=Agency%20Representation',
  bottom_cta_highlights jsonb not null default '[]'::jsonb,
  bottom_cta_backdrop_asset_id text references public.media_assets(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- 14. Contact Page Settings
create table if not exists public.contact_page_settings (
  id text primary key default 'default',
  hero_corner_caption text not null default 'NEW OPPORTUNITIES. SAME VISION.',
  side_card_kicker text not null default 'BOOKING',
  side_card_title text not null default 'AGENCIES, BRANDS, CREATORS, AND MORE.',
  side_card_subtitle text not null default 'Let''s create something iconic.',
  side_card_asset_id text references public.media_assets(id) on delete set null,
  location_kicker text not null default 'WHERE I AM',
  location_title text not null default 'LAGOS, NIGERIA',
  location_description text not null default 'Available for local and international projects. Let''s connect and bring your vision to life.',
  location_handwritten_note text not null default 'Different Cities. Same Dream.',
  location_backdrop_asset_id text references public.media_assets(id) on delete set null,
  available_markets jsonb not null default '["Lagos, Nigeria","Paris, France","Milan, Italy","Spain"]'::jsonb,
  updated_at timestamptz not null default now()
);

-- 15. Experience Page Settings
create table if not exists public.experience_page_settings (
  id text primary key default 'default',
  hero_corner_caption text not null default 'FASHION IS MORE THAN A JOB. IT''S A JOURNEY.',
  timeline_kicker text not null default 'TIMELINE',
  timeline_title text not null default 'SELECTED EXPERIENCE',
  timeline_description text not null default 'A curated archive of verified projects across campaigns, runways, editorials, publications, and creative collaborations.',
  category_descriptions jsonb not null default '{}'::jsonb,
  category_cover_asset_ids jsonb not null default '{}'::jsonb,
  bottom_cta_kicker text not null default 'MORE TO EXPLORE',
  bottom_cta_title text not null default 'VIEW MY FULL PORTFOLIO.',
  bottom_cta_description text not null default 'Browse through more campaigns, editorials, and creative work from across my journey.',
  bottom_cta_text text not null default 'GO TO PORTFOLIO',
  bottom_cta_link text not null default '/portfolio',
  bottom_cta_backdrop_asset_id text references public.media_assets(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- 16. Portfolio Page Settings
create table if not exists public.portfolio_page_settings (
  id text primary key default 'default',
  hero_corner_caption text not null default 'DIFFERENT STORIES. SAME VISION.',
  bottom_cta_title text not null default 'LET''S WORK TOGETHER',
  bottom_cta_description text not null default 'Whether it''s a campaign, editorial, runway or creative project — I''d love to bring your vision to life.',
  bottom_cta_text text not null default 'GET IN TOUCH',
  bottom_cta_link text not null default '/contact',
  bottom_cta_tagline text not null default 'MODEL  /  CREATIVE  /  DREAMER',
  bottom_cta_backdrop_asset_id text references public.media_assets(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- 17. Admin Activity Log
create table if not exists public.admin_activity (
  id text primary key default gen_random_uuid()::text,
  action text not null,
  detail text not null default '',
  section text not null default 'dashboard',
  created_at timestamptz not null default now()
);

-- Enable Row Level Security on all tables
alter table public.admin_profiles enable row level security;
alter table public.media_assets enable row level security;
alter table public.page_heroes enable row level security;
alter table public.homepage_settings enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.digitals_items enable row level security;
alter table public.experience_entries enable row level security;
alter table public.representation_agencies enable row level security;
alter table public.contact_inquiries enable row level security;
alter table public.site_settings enable row level security;
alter table public.about_page_settings enable row level security;
alter table public.digitals_page_settings enable row level security;
alter table public.representation_page_settings enable row level security;
alter table public.contact_page_settings enable row level security;
alter table public.experience_page_settings enable row level security;
alter table public.portfolio_page_settings enable row level security;
alter table public.admin_activity enable row level security;

-- Public Read Policies
-- Public can access media, heroes, page settings, and only published/active projects & agencies
create policy "Public read media_assets" on public.media_assets for select using (true);
create policy "Public read page_heroes" on public.page_heroes for select using (true);
create policy "Public read homepage_settings" on public.homepage_settings for select using (true);
create policy "Public read portfolio_projects" on public.portfolio_projects for select using (is_published = true or public.is_admin());
create policy "Public read digitals_items" on public.digitals_items for select using (true);
create policy "Public read experience_entries" on public.experience_entries for select using (is_published = true or public.is_admin());
create policy "Public read representation_agencies" on public.representation_agencies for select using (is_active = true or public.is_admin());
create policy "Public read site_settings" on public.site_settings for select using (true);
create policy "Public read about_page_settings" on public.about_page_settings for select using (true);
create policy "Public read digitals_page_settings" on public.digitals_page_settings for select using (true);
create policy "Public read representation_page_settings" on public.representation_page_settings for select using (true);
create policy "Public read contact_page_settings" on public.contact_page_settings for select using (true);
create policy "Public read experience_page_settings" on public.experience_page_settings for select using (true);
create policy "Public read portfolio_page_settings" on public.portfolio_page_settings for select using (true);

-- Public Insert Policy for Contact Inquiries (strictly status = 'new')
create policy "Public submit contact_inquiries" on public.contact_inquiries for insert with check (status = 'new');

-- Admin Full Access Policies
create policy "Admin read admin_profiles" on public.admin_profiles for select using (auth.uid() = id or public.is_admin());
create policy "Admin manage media_assets" on public.media_assets for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin manage page_heroes" on public.page_heroes for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin manage homepage_settings" on public.homepage_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin manage portfolio_projects" on public.portfolio_projects for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin manage digitals_items" on public.digitals_items for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin manage experience_entries" on public.experience_entries for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin manage representation_agencies" on public.representation_agencies for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin manage contact_inquiries" on public.contact_inquiries for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin manage site_settings" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin manage about_page_settings" on public.about_page_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin manage digitals_page_settings" on public.digitals_page_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin manage representation_page_settings" on public.representation_page_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin manage contact_page_settings" on public.contact_page_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin manage experience_page_settings" on public.experience_page_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin manage portfolio_page_settings" on public.portfolio_page_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "Admin manage admin_activity" on public.admin_activity for all using (public.is_admin()) with check (public.is_admin());

-- Auto-provision admin profile trigger for designated admin email upon signup
create or replace function public.handle_admin_user_signup()
returns trigger as $$
begin
  if lower(new.email) in ('eletuabibat12@gmail.com') then
    insert into public.admin_profiles (id, email, role)
    values (new.id, new.email, 'admin')
    on conflict (id) do update set role = 'admin';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created_admin on auth.users;
create trigger on_auth_user_created_admin
  after insert on auth.users
  for each row execute function public.handle_admin_user_signup();
