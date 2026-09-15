-- Creative OS — Local PostgreSQL / pgAdmin schema
-- TARGET: dedicated database creative_os_db
-- IMPORTANT: This resets the PUBLIC schema in the CURRENT database.
-- Run ONLY in creative_os_db. Do not run in another database containing valuable public-schema objects.

begin;

drop schema if exists public cascade;
create schema public;
grant all on schema public to postgres;
grant all on schema public to public;

create extension if not exists pgcrypto;

-- ---------- shared helpers ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- local users + workspaces ----------
create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text,
  password_hash text,
  status text not null default 'active' check (status in ('active','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- ---------- core ----------
create table public.brands (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  category text,
  positioning text,
  brand_promise text,
  differentiator text,
  tone text,
  visual_identity jsonb not null default '{}'::jsonb,
  guardrails jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id text not null references public.brands(id) on delete cascade,
  name text not null,
  sku text,
  mrp numeric check (mrp is null or mrp >= 0),
  selling_price numeric check (selling_price is null or selling_price >= 0),
  pack_size text,
  product_truth jsonb not null default '{}'::jsonb,
  claims_allowed jsonb not null default '[]'::jsonb,
  claims_prohibited jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('draft','planned','active','inactive','archived')),
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audiences (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id text not null references public.brands(id) on delete cascade,
  name text not null,
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Local mode stores a filesystem path or URL instead of Supabase Storage object path.
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id text not null references public.brands(id) on delete cascade,
  product_id text references public.products(id) on delete cascade,
  asset_type text not null check (asset_type in ('front_pack','back_pack','cookie_reference','ingredient_reference','logo','creative','environment','other')),
  storage_path text not null,
  is_canonical boolean not null default false,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id text not null references public.brands(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  stage text not null check (stage in ('research','angles','hooks','concepts','briefs','production','qa','testing','performance','learning','expansion')),
  status text not null default 'draft' check (status in ('draft','running','complete','blocked','failed')),
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  approved boolean not null default false,
  approved_by uuid references public.app_users(id) on delete set null,
  approved_at timestamptz,
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.opportunities (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  run_id uuid references public.pipeline_runs(id) on delete cascade,
  brand_id text not null references public.brands(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  audience_id text references public.audiences(id) on delete set null,
  territory_name text,
  buyer_tension text,
  awareness_stage text,
  psychological_lever text,
  product_proof text,
  score numeric check (score is null or (score >= 0 and score <= 10)),
  evidence_confidence text check (evidence_confidence is null or evidence_confidence in ('Low','Medium','High')),
  decision text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.angles (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  opportunity_id text references public.opportunities(id) on delete set null,
  brand_id text not null references public.brands(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  audience_id text references public.audiences(id) on delete set null,
  name text,
  strategic_statement text,
  core_tension text,
  belief_shift text,
  awareness_stage text,
  primary_lever text,
  product_proof text,
  score numeric check (score is null or (score >= 0 and score <= 10)),
  evidence_confidence text check (evidence_confidence is null or evidence_confidence in ('Low','Medium','High')),
  decision text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.hooks (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  angle_id text not null references public.angles(id) on delete cascade,
  family text,
  hook text not null,
  score numeric check (score is null or (score >= 0 and score <= 10)),
  decision text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.concepts (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  hook_id text not null references public.hooks(id) on delete cascade,
  angle_id text not null references public.angles(id) on delete cascade,
  name text,
  visual_device text,
  scene text,
  primary_visual_idea text,
  product_scale numeric check (product_scale is null or (product_scale >= 0 and product_scale <= 100)),
  score numeric check (score is null or (score >= 0 and score <= 10)),
  decision text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.briefs (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  concept_id text references public.concepts(id) on delete set null,
  hook_id text references public.hooks(id) on delete set null,
  angle_id text references public.angles(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','blocked','ready','in_production','qa','approved','archived')),
  objective text,
  exact_hook text,
  support_copy text,
  proof_lines jsonb not null default '[]'::jsonb,
  cta text,
  format text,
  product_scale numeric check (product_scale is null or (product_scale >= 0 and product_scale <= 100)),
  required_assets jsonb not null default '[]'::jsonb,
  blockers jsonb not null default '[]'::jsonb,
  brief_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.production_jobs (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brief_id text not null references public.briefs(id) on delete cascade,
  version text not null default 'V1',
  status text not null default 'draft' check (status in ('draft','ready','blocked','rendering','rendered','failed','qa','approved')),
  environment_prompt text,
  negative_prompt text,
  product_instructions text,
  composite_order jsonb not null default '[]'::jsonb,
  export_spec jsonb not null default '{}'::jsonb,
  output_asset_id uuid references public.assets(id) on delete set null,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tests (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id text not null references public.brands(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  hypothesis text,
  variable_under_test text,
  controls jsonb not null default '{}'::jsonb,
  creative_ids jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','queued','running','complete','cancelled')),
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.performance (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  creative_id text not null,
  date date not null,
  platform text,
  campaign text,
  spend numeric not null default 0 check (spend >= 0),
  impressions bigint not null default 0 check (impressions >= 0),
  clicks bigint not null default 0 check (clicks >= 0),
  ctr numeric,
  cpc numeric,
  purchases integer not null default 0 check (purchases >= 0),
  revenue numeric not null default 0 check (revenue >= 0),
  cpa numeric,
  roas numeric,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, creative_id, date, platform, campaign)
);

create table public.learnings (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  brand_id text not null references public.brands(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  component_type text,
  component_id text,
  signal text,
  evidence jsonb not null default '{}'::jsonb,
  confidence text check (confidence is null or confidence in ('Low','Medium','High')),
  action text,
  status text not null default 'active' check (status in ('active','superseded','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prompt_specs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  stage text not null,
  version numeric not null default 1,
  prompt text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, stage, version)
);

create table public.creative_renders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  production_job_id text not null references public.production_jobs(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  environment_path text,
  creative_path text,
  width integer not null default 1080 check (width > 0),
  height integer not null default 1350 check (height > 0),
  status text not null default 'rendered' check (status in ('queued','rendering','rendered','failed','qa','approved','rejected')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- integrity + indexes ----------
create unique index uq_assets_one_canonical_per_type
  on public.assets(workspace_id, product_id, asset_type)
  where is_canonical = true and product_id is not null;

create unique index uq_products_workspace_sku
  on public.products(workspace_id, sku)
  where sku is not null;

create index idx_products_workspace_brand on public.products(workspace_id, brand_id, status);
create index idx_audiences_workspace_brand on public.audiences(workspace_id, brand_id);
create index idx_assets_workspace_product_type on public.assets(workspace_id, product_id, asset_type, is_canonical);
create index idx_pipeline_runs_workspace on public.pipeline_runs(workspace_id, brand_id, product_id, stage, created_at desc);
create index idx_opportunities_run on public.opportunities(workspace_id, run_id);
create index idx_angles_product on public.angles(workspace_id, product_id, decision, score desc);
create index idx_hooks_angle on public.hooks(workspace_id, angle_id, decision, score desc);
create index idx_concepts_hook on public.concepts(workspace_id, hook_id, decision, score desc);
create index idx_briefs_status on public.briefs(workspace_id, status, created_at desc);
create index idx_production_jobs_status on public.production_jobs(workspace_id, status, created_at desc);
create index idx_performance_creative_date on public.performance(workspace_id, creative_id, date desc);
create index idx_learnings_component on public.learnings(workspace_id, component_type, component_id, status);
create index idx_creative_renders_job on public.creative_renders(workspace_id, production_job_id, created_at desc);

-- ---------- updated_at triggers ----------
do $$
declare t text;
begin
  foreach t in array array[
    'app_users','workspaces','brands','products','audiences','assets','pipeline_runs','opportunities','angles','hooks','concepts','briefs','production_jobs','tests','performance','learnings','prompt_specs','creative_renders'
  ] loop
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'trg_' || t || '_updated_at', t);
  end loop;
end $$;

commit;

-- Verification helper: after execution this should return a list of Creative OS tables.
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
