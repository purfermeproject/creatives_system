# Amazon Intelligence Operating System — Product & Technical Design

Status: Draft v1 (design phase, no code yet)
Owner: purfermeproject
Relationship to this repo: this design extends **Creative OS Browser V7** (the existing
`research → angles → hooks → concepts → briefs → production → qa → testing → performance →
learning → expansion` pipeline in `lib/stages.ts`, `lib/pipeline-prompts.ts`,
`postgres/schema_pgadmin.sql`) rather than replacing it. V7 is currently a paid-social
creative engine for one brand (Pur' Ferme). This document turns it into a general
**Amazon Market Research → Decision Support → Listing Strategy → Creative Generation**
system. Section 5 explains exactly what is reused, what is renamed, and what is net-new.

---

## 1. Product Scope & Vision

### 1.1 The three questions the product must answer
1. **Is this product/category worth entering?** → Market Research Layer (A)
2. **How should I position and optimize the listing?** → Decision-Support Layer (B)
3. **What creatives should I make to convert better?** → Listing Intelligence + Creative
   Generation Layer (C)

### 1.2 Design principle
Every AI output must be traceable to inputs and must explain **why**, not just **what**.
An opportunity score without a rationale is not shippable. This mirrors the existing V7
convention (`opportunities.data`, `evidence_confidence`, `decision` columns) — we keep
that discipline and extend it to market data.

### 1.3 North Star flow
```
Product Data + Market Data + Competitor Data + Keyword Data + Brand Data
        │
        ▼
  Market Intelligence            (Layer A)
        │
        ▼
  Opportunity / Positioning Analysis
        │
        ▼
  Decision-Support Recommendations   (Layer B)
        │
        ▼
  Listing Strategy (7-image plan)
        │
        ▼
  Creative Direction  ── user approval gate ──┐
        │                                     │
        ▼                                     │
  Image Generation                (Layer C)   │
        │                                     │
        ▼                                     │
  Performance Feedback ────────────────────────┘  (V2+: closes the loop back into Layer B)
```

This is the same **stage-gated pipeline pattern** already implemented in
`pipeline_runs` (draft → running → complete/blocked/failed, with `approved` /
`approved_by` / `approved_at`). We are adding stages upstream of `research`, not
inventing a new execution model.

---

## 2. User Flow

### 2.1 MVP end-to-end flow (single product, single workspace)
1. **Create/select a workspace and brand** (already exists: `workspaces`, `brands`).
2. **Enter a product** — keyword, category, ASIN, or Amazon listing URL, plus manual
   product data (name, category, features/benefits, ingredients/specs, price, target
   audience, brand tone/colors/fonts) and photo uploads. Maps to `products` + `assets`.
3. **Add competitors** — 3–8 competitor ASINs/URLs, pasted or looked up by keyword.
4. **Add keywords** (optional in MVP) — paste a keyword list or CSV; MVP does not require
   a live Search Query Performance / SP-API integration.
5. **Run Market Research** (new stage `market_research`) — system fetches/normalizes
   competitor listing data (title, bullets, price, rating, review count, images,
   A+ content presence, category/BSR if available) and produces a market snapshot.
6. **Run Opportunity Analysis** (new stage `opportunity_analysis`) — LLM reasoning over
   the market snapshot + keyword list produces positioning gaps, saturated vs. underused
   messaging, and scored opportunity territories (reuses the existing `opportunities`
   table shape, extended with Amazon-specific columns — see §8).
7. **Review Decision-Support recommendations** (new stage `decision_support`) — keyword
   priorities, benefits to emphasize, competitor weaknesses, positioning angles to test,
   listing-copy diagnosis. User can accept/reject each recommendation (same
   accept/reject/`decision` pattern as `angles`/`hooks`/`concepts`).
8. **Generate Listing Strategy** (new stage `listing_strategy`) — a 6–7 image plan, each
   image with objective, consumer insight, headline, supporting copy, visual concept,
   layout direction, product placement, image-gen prompt, compliance notes. This is a
   product-scoped analog of existing `briefs`.
9. **User approves the strategy** — per-image approve/edit/regenerate, same UX pattern as
   the current pipeline's stage gate, but at image granularity instead of whole-stage
   granularity.
10. **Generate creatives** (existing `production` + `creative_renders` machinery, reused
    as-is) — AI environment generation + Sharp compositing of real product photos +
    exact typography, exactly like the current cookie-pack compositing approach.
11. **Regenerate/edit a single image** without rebuilding the listing — already supported
    structurally today via one row per `production_jobs`/`briefs`; UI just needs a
    per-image action.

### 2.2 Post-MVP flow additions (V2/V3)
- Ongoing competitor monitoring (scheduled re-scrape + diff alerts).
- Review mining / VoC extraction feeding back into `opportunity_analysis`.
- PPC + conversion performance ingestion feeding the existing `performance` →
  `learning` → `expansion` stages, now scoped to listing images instead of only ad
  creatives.
- Multi-product / multi-marketplace portfolio view.

---

## 3. MVP V1 Scope (explicit in/out)

### In scope for V1
- Manual product input (form) + photo upload.
- Competitor input by ASIN/URL (manual paste, up to ~8 competitors) or by keyword search
  via a data provider (see §14).
- One-time market snapshot: price positioning, rating/review landscape, brand
  concentration, keyword-in-title/bullet coverage, claim/positioning pattern extraction.
- Keyword list: manual paste/CSV import; no live SP-API/Search Query Performance in V1.
- LLM-driven opportunity analysis with explicit rationale (not just a bare score).
- Decision-support recommendation list (keyword priorities, benefits to emphasize,
  competitor weaknesses, overused angles, gaps to test) with accept/reject.
- 6–7 image listing strategy generation with full per-image brief.
- Strategy approval UI (approve/edit per image).
- Image generation reusing existing AI-environment + Sharp-composite pipeline.
- Single-image regenerate/edit without rebuilding the whole listing.
- Single workspace/brand model already present; no new auth work required.

### Explicitly out of scope for V1 (deferred to V2/V3, §4)
- Automated/scheduled competitor monitoring and change alerts.
- Customer review mining / Voice-of-Customer NLP pipeline.
- Amazon Search Query Performance / Search Term Report ingestion.
- Live SP-API integration (orders, inventory, advertising).
- PPC performance ingestion and PPC-driven recommendations.
- Conversion-rate feedback loop (this exists structurally as `performance`/`learning`
  but is not wired to Amazon in V1).
- Multi-marketplace (only one marketplace, e.g., amazon.com, in V1).
- Team roles/permissions beyond the existing `workspace_members` role enum.
- Numeric "opportunity score" as the headline output — V1 leads with explanation; a
  score is a secondary, clearly-labeled heuristic, not a promised deliverable.

---

## 4. Roadmap: V2 / V3

### V2 — Intelligence deepening
- Review mining: pull competitor review text (where a compliant data source exists),
  cluster complaints/praises, feed as VoC evidence into `opportunity_analysis` (mirrors
  existing `voc` handling in the current `research` prompt).
- Scheduled competitor re-scrape (weekly) with diff detection → "what changed" alerts
  (price moves, new competitor entrant, rating/review velocity change, listing copy
  change).
- Keyword intelligence: connect a real keyword-data API (Jungle Scout, DataDive, Cerebro/
  Helium 10, or Amazon Ads Keyword Recommendations) instead of manual CSV.
- Listing audit mode: paste your *own* live listing URL/ASIN and get a graded diagnosis
  against the same rubric used for competitors.
- A/B test tracking for listing images (extends `tests`/`performance`/`learning`, which
  already exist and are provider-agnostic).

### V3 — Amazon Intelligence Operating System
- Amazon SP-API integration: Search Query Performance, Business Reports, Advertising
  API (PPC spend/ACOS/ROAS) — closes the loop from `production` → `performance` →
  `learning` with real Amazon data instead of manual CSV import.
- Continuous opportunity re-scoring as market data refreshes (cron-driven re-runs of
  `market_research`/`opportunity_analysis` stages, using the existing `pipeline_runs`
  history for trend lines).
- Portfolio-level dashboard across many ASINs/categories per workspace.
- Automated positioning-drift detection (your listing vs. current market consensus).
- Multi-marketplace (US/UK/DE/...) and multi-language listing generation.
- Programmatic creative expansion at scale reusing the existing `expansion` stage.

---

## 5. How this maps onto the existing repo (V7 → Amazon OS)

| Existing V7 concept | Role today | Role in Amazon OS |
|---|---|---|
| `lib/stages.ts` STAGES array | Paid-social pipeline stages | Extend with 3 new stages inserted *before* `research`: `market_research`, `opportunity_analysis`, `decision_support`. Existing `research` stage is renamed in purpose from "creative/VOC research" to "listing strategy research" and now consumes `opportunity_analysis` output as its `input.opportunities`. |
| `lib/pipeline-prompts.ts` | One prompt string per stage | Add one prompt per new stage (§15). Same `Record<string, string>` shape, same FACT/VERIFIED/HYPOTHESIS discipline already used in the `research` prompt. |
| `pipeline_runs` table | Generic stage/status/input/output store | Reused unchanged — `stage` check constraint gets the 3 new values added. |
| `opportunities` table | Paid-social positioning territories | Reused, extended with Amazon columns: `source_asin`, `market_snapshot_id`, `keyword_ids[]`, `saturation_level`, `whitespace_type`. |
| `briefs` / `production_jobs` / `creative_renders` | Ad creative production | Reused as-is for the 6–7 listing images; `format` column now holds `amazon_main`, `amazon_benefit`, `amazon_proof`, `amazon_comparison`, `amazon_lifestyle`, `amazon_usage`, `amazon_trust` instead of ad aspect ratios. |
| `assets` table (`asset_type` enum) | Brand/product reference assets | Add `asset_type` values: `competitor_screenshot`, `market_data_export`. |
| `products` table | Brand product | Add Amazon-specific columns: `asin`, `category_path`, `target_keywords`, `marketplace`. |
| `lib/ai.ts` provider abstraction (Gemini/OpenAI) | Text + image generation | Reused unchanged for all new stages — no new AI plumbing needed. |
| `lib/image-production.ts` (Sharp compositing) | Environment-gen + real-asset composite | Reused unchanged for listing image production. |
| `tests` / `performance` / `learning` / `expansion` | Post-launch feedback loop | Reused unchanged for V2/V3 Amazon performance feedback. |

Net-new tables needed (none exist today): `markets`, `market_snapshots`,
`competitor_listings`, `keywords`, `keyword_targets`, `decision_recommendations`,
`listing_strategies`. Full DDL in §8.

---

## 6. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend — Next.js App Router (existing app/ tree, extended)    │
│  /markets  /markets/[id]/research  /markets/[id]/opportunities   │
│  /products/[id]/decision-support  /products/[id]/strategy        │
│  /products/[id]/production  (existing)                           │
└───────────────┬───────────────────────────────────────────────────┘
                │ REST (existing app/api pattern, Next.js route handlers)
┌───────────────▼───────────────────────────────────────────────────┐
│  API layer — app/api/*  (existing pattern: thin route handlers    │
│  calling lib/ services)                                           │
│  /api/markets  /api/markets/[id]/snapshot  /api/pipeline/run      │
│  /api/keywords/import  /api/competitors/ingest                    │
└───────────────┬───────────────────────────────────────────────────┘
                │
┌───────────────▼───────────────────────────────────────────────────┐
│  Service layer — lib/*                                            │
│  lib/ai.ts (existing)         lib/market-ingest.ts (new)          │
│  lib/pipeline-prompts.ts (+3) lib/competitor-scrape.ts (new)       │
│  lib/image-production.ts      lib/keyword-import.ts (new)         │
│  lib/db.ts (existing pg pool) lib/scoring.ts (new — opportunity   │
│                                heuristics that *support*, don't    │
│                                replace, LLM rationale)             │
└───────────────┬───────────────────────────────────────────────────┘
                │
┌───────────────▼───────────────────────────────────────────────────┐
│  Data layer                                                       │
│  PostgreSQL (existing creative_os_db, schema extended)             │
│  Local filesystem storage (existing ./storage, reused for          │
│  competitor screenshots + market data exports)                     │
└─────────────────────────────────────────────────────────────────┘
                │
┌───────────────▼───────────────────────────────────────────────────┐
│  External data sources (§14) — called from lib/market-ingest.ts   │
│  and lib/competitor-scrape.ts, never called directly from routes  │
└─────────────────────────────────────────────────────────────────┘
```

No new runtime component is introduced (no queue, no separate worker service) for V1 —
stage runs are synchronous request/response calls exactly like the current pipeline,
since LLM calls of this shape are already tolerated by the existing UI (`app/pipeline/page.tsx`
polls/awaits a run). If competitor ingestion becomes slow (many ASINs, rate-limited
providers), V2 can add a simple background job table (`pipeline_runs.status = 'running'`
already supports polling) rather than a new subsystem.

---

## 7. Frontend Architecture

Extend the existing route groups; do not introduce a second frontend framework or
state-management library.

```
app/
  markets/
    page.tsx                    -- list of researched markets/products
    [productId]/
      research/page.tsx         -- Layer A: market snapshot view
      opportunities/page.tsx    -- Layer A: opportunity territories, accept/reject
      decision-support/page.tsx -- Layer B: recommendation list, accept/reject
      strategy/page.tsx         -- Layer C: 7-image plan, approve/edit/regenerate
  products/            (existing) -- product CRUD, photo upload
  pipeline/             (existing) -- generic stage runner UI, gains 3 new stage tabs
  production/            (existing) -- image production, reused unchanged
```

Component reuse: the current `app/pipeline/page.tsx` already renders a generic
stage/approve/run UI driven by `STAGES`. Adding the 3 new stage keys to `STAGES`
means this page gains the new stages "for free" with only stage-specific renderers
needed (a market-snapshot table view, an opportunity-card view, a recommendation
checklist view). No new page-level routing pattern is required.

State/data fetching: keep the existing pattern (server components + fetch to
`app/api/*`, no client-side global store) — nothing here demands React Query or
Redux; the pipeline is inherently a sequence of server-persisted stage runs.

---

## 8. Database Structure (additive migration on top of `schema_pgadmin.sql`)

```sql
-- ---------- Amazon-specific product fields ----------
alter table public.products
  add column if not exists asin text,
  add column if not exists marketplace text not null default 'amazon.com',
  add column if not exists category_path text,
  add column if not exists listing_url text;

-- ---------- markets: one row per (category/keyword) research scope ----------
create table public.markets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  product_id text references public.products(id) on delete cascade,
  seed_type text not null check (seed_type in ('keyword','category','asin','url')),
  seed_value text not null,
  marketplace text not null default 'amazon.com',
  created_by uuid references public.app_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- one immutable snapshot per market-research run ----------
create table public.market_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete cascade,
  run_id uuid references public.pipeline_runs(id) on delete set null,
  category_attractiveness jsonb not null default '{}'::jsonb,
  demand_estimate jsonb not null default '{}'::jsonb,
  price_distribution jsonb not null default '{}'::jsonb,
  review_landscape jsonb not null default '{}'::jsonb,
  brand_concentration jsonb not null default '{}'::jsonb,
  claim_patterns jsonb not null default '{}'::jsonb,
  data_sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- competitor listings captured for a market snapshot ----------
create table public.competitor_listings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  market_snapshot_id uuid not null references public.market_snapshots(id) on delete cascade,
  asin text,
  url text,
  brand text,
  title text,
  bullets jsonb not null default '[]'::jsonb,
  price numeric,
  currency text default 'USD',
  rating numeric check (rating is null or (rating >= 0 and rating <= 5)),
  review_count integer,
  bsr integer,
  image_urls jsonb not null default '[]'::jsonb,
  has_aplus_content boolean,
  has_video boolean,
  extracted_claims jsonb not null default '[]'::jsonb,
  raw_data jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now()
);

-- ---------- keyword universe for a market ----------
create table public.keywords (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete cascade,
  keyword text not null,
  search_volume integer,
  competition_score numeric,
  relevancy_score numeric,
  source text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(market_id, keyword)
);

-- ---------- prioritized keyword targets, product-scoped ----------
create table public.keyword_targets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  keyword_id uuid not null references public.keywords(id) on delete cascade,
  priority text not null default 'medium' check (priority in ('primary','secondary','backend','avoid')),
  rationale text,
  run_id uuid references public.pipeline_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(product_id, keyword_id)
);

-- ---------- decision-support recommendations ----------
create table public.decision_recommendations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  run_id uuid references public.pipeline_runs(id) on delete set null,
  category text not null check (category in
    ('keyword_priority','benefit_emphasis','competitor_weakness','overused_angle',
     'market_gap','listing_diagnosis','next_test')),
  title text not null,
  rationale text not null,
  evidence jsonb not null default '{}'::jsonb,
  confidence text check (confidence is null or confidence in ('Low','Medium','High')),
  decision text not null default 'pending' check (decision in ('pending','accepted','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- the 6-7 image listing strategy (one row per product per version) ----------
create table public.listing_strategies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  run_id uuid references public.pipeline_runs(id) on delete set null,
  version integer not null default 1,
  status text not null default 'draft' check (status in ('draft','approved','archived')),
  positioning_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, version)
);

-- ---------- one row per image slot inside a strategy ----------
create table public.listing_strategy_images (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  listing_strategy_id uuid not null references public.listing_strategies(id) on delete cascade,
  slot_number integer not null check (slot_number between 1 and 7),
  slot_type text not null check (slot_type in
    ('hero','primary_benefit','proof_features','differentiation','lifestyle','usage','trust_faq')),
  objective text,
  consumer_insight text,
  headline text,
  supporting_copy text,
  visual_concept text,
  layout_direction text,
  product_placement text,
  image_prompt text,
  compliance_notes text,
  status text not null default 'draft' check (status in ('draft','approved','regenerating','archived')),
  brief_id text references public.briefs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(listing_strategy_id, slot_number)
);

alter table public.pipeline_runs
  drop constraint pipeline_runs_stage_check,
  add constraint pipeline_runs_stage_check check (stage in
    ('market_research','opportunity_analysis','decision_support',
     'research','angles','hooks','concepts','briefs','production',
     'qa','testing','performance','learning','expansion','listing_strategy'));

alter table public.assets
  drop constraint assets_asset_type_check,
  add constraint assets_asset_type_check check (asset_type in
    ('front_pack','back_pack','cookie_reference','ingredient_reference','logo',
     'creative','environment','other','competitor_screenshot','market_data_export'));

create index idx_market_snapshots_market on public.market_snapshots(workspace_id, market_id, created_at desc);
create index idx_competitor_listings_snapshot on public.competitor_listings(workspace_id, market_snapshot_id);
create index idx_keywords_market on public.keywords(workspace_id, market_id, search_volume desc nulls last);
create index idx_keyword_targets_product on public.keyword_targets(workspace_id, product_id, priority);
create index idx_decision_recs_product on public.decision_recommendations(workspace_id, product_id, category, decision);
create index idx_listing_strategy_images_strategy on public.listing_strategy_images(workspace_id, listing_strategy_id, slot_number);
```

This keeps every net-new table `workspace_id`-scoped (matching existing multi-tenant
convention) and every AI-output table carrying a `run_id` back to `pipeline_runs`, so
the existing run history / audit trail pattern extends without change.

---

## 9. AI Agents / Workflow

Same execution model as today: one prompt per stage in `lib/pipeline-prompts.ts`, one
row per run in `pipeline_runs`, gated by `approved`/`decision`. Six stages instead of
open-ended "agents" — this keeps behavior deterministic, reviewable, and debuggable
(each stage's `input_json`/`output_json` is inspectable), consistent with the existing
system's philosophy of explicit staged pipelines over free-roaming agents.

| Stage key | Consumes | Produces | Gate |
|---|---|---|---|
| `market_research` | market seed (keyword/ASIN/URL), competitor listings, raw scraped data | `market_snapshots` row + `competitor_listings` rows | auto (data compilation, light LLM normalization) |
| `opportunity_analysis` | `market_snapshots`, `keywords` | `opportunities` rows (extended), each with rationale + confidence | user accept/reject per opportunity |
| `decision_support` | accepted `opportunities`, `keywords` | `decision_recommendations` rows | user accept/reject per recommendation |
| `research` (existing, repurposed) | accepted `decision_recommendations`, product truth | product/positioning research doc feeding strategy (existing `research` prompt logic, now Amazon-scoped) | existing gate |
| `listing_strategy` (new) | approved `research` output + accepted recommendations | `listing_strategies` + 6–7 `listing_strategy_images` rows | user approves per image |
| `production` (existing, reused) | approved `listing_strategy_images` (mapped 1:1 to `briefs`) | `production_jobs` + `creative_renders` | existing QA gate |

Why not a single "do everything" agent: Amazon claims/compliance risk, cost control
(smaller prompts are cheaper and more auditable), and because the user must be able to
intervene between "here's the opportunity" and "here's the creative" — collapsing
stages would remove exactly the approval checkpoints the spec asks for.

---

## 10. Market Research Logic

Inputs: market seed + up to N competitor listings (scraped or pasted) + keyword list.

Deterministic (non-LLM) computations done in `lib/scoring.ts` before the LLM call, so
the model reasons over numbers instead of inventing them:
- **Price positioning**: percentile of the product's price vs. competitor price
  distribution (min/median/p75/max).
- **Review/rating landscape**: mean rating, review-count distribution, rating vs.
  review-count outliers (e.g., high rating + low reviews = newer strong entrant).
- **Brand concentration**: share of competitor listings per brand (HHI-style
  concentration index) → "3 brands own 70% of page-1 listings" style fact.
- **Keyword-in-listing coverage**: for each keyword, % of competitor titles/bullets
  containing it → mechanical whitespace detection, not LLM guesswork.
- **Demand estimate**: MVP proxy = keyword search volume (if a keyword API is
  connected) + review-count velocity as a demand proxy; explicitly labeled as an
  *estimate* with a confidence flag, never presented as verified Amazon sales data
  unless SP-API is connected (V3).

LLM layer (`market_research` + `opportunity_analysis` prompts) then explains: why the
category is/isn't attractive, which claims are saturated vs. rare (from
`extracted_claims` across `competitor_listings`), and where the whitespace is — always
citing which competitor listings/keywords support each claim (evidence array, not bare
assertion), same discipline as the existing `research` prompt's
FACT/VERIFIED/HYPOTHESIS separation.

---

## 11. Competitor-Analysis Logic

1. **Ingestion**: `lib/competitor-scrape.ts` takes ASIN/URL list → calls a compliant
   third-party Amazon data API (§14) rather than scraping amazon.com HTML directly —
   avoids ToS/anti-bot risk and gives structured data (title, bullets, price, rating,
   review count, images, BSR, category) directly.
2. **Normalization**: map provider response → `competitor_listings` schema.
3. **Claim extraction**: LLM pass over title+bullets+description per competitor →
   structured `extracted_claims` (e.g., "USDA organic", "30-day guarantee",
   "dermatologist tested") with a claim-type taxonomy, stored per listing so patterns
   can be aggregated (saturated claim = appears in >50% of listings; underused claim
   = appears in <15% but is plausible for this product).
4. **Positioning-pattern aggregation**: group claims/messaging themes across all
   `competitor_listings` in a snapshot → feeds directly into `opportunity_analysis`'s
   saturation/whitespace section.
5. **Compliance note**: V1 only ingests publicly visible listing content the user
   points at (ASIN/URL they provide) via a licensed data API; no login-walled or
   review-scraping-at-scale behavior in V1 (review mining is explicitly V2 and must
   use a compliant provider, not raw scraping).

---

## 12. Listing-Strategy Logic

`listing_strategy` stage takes the approved research + accepted `decision_recommendations`
and must produce exactly 6–7 `listing_strategy_images`, one per `slot_type`, in fixed
order (matches the sequence in the request):
1. `hero` — main/hero product image
2. `primary_benefit` — primary consumer benefit
3. `proof_features` — product proof / ingredients / features
4. `differentiation` — differentiation / comparison
5. `lifestyle` — lifestyle / use case
6. `usage` — usage / occasion / demonstration
7. `trust_faq` — trust / brand story / FAQ / supporting proof (optional 7th; prompt
   allows the model to return 6 if the product genuinely doesn't support a 7th distinct
   idea — no padding).

Each slot's `image_prompt` must reference **specific** accepted `decision_recommendations`
and `opportunities` IDs it is acting on (stored in `listing_strategy_images` via a
join table or simply embedded IDs in a `data` jsonb — kept it as flat columns above for
V1 simplicity; can add a `listing_strategy_image_sources` join table in V2 if
multi-sourcing per slot is needed).

Regeneration: regenerating slot N only re-runs that single row (new `image_prompt`,
same `listing_strategy_id`/`slot_number`), not the whole strategy — enabled directly
by the one-row-per-slot schema.

---

## 13. Image-Generation Workflow

Reuses the existing production architecture unchanged:
- `listing_strategy_images` (approved) → 1:1 create a `briefs` row (existing table) →
  `production_jobs` row → Sharp compositing exactly as documented in `ARCHITECTURE.md`:
  AI generates environment/background only; real uploaded product photos are
  composited on top; exact typography (headline/supporting copy from the strategy
  row) is rendered locally, not by the image model — this is the same "L1 AI
  environment, L2 real product, L3 exact typography, L4 brand UI, L5 finishing"
  layering already defined in the `production` prompt in `lib/pipeline-prompts.ts`.
- Amazon-specific constraints added to the `production` prompt/brief: 2000x2000px
  minimum, pure white (RGB 255,255,255) background required for the main/hero image
  only (Amazon image policy), no more than the seller's own claims, no
  pre/post-purchase-prohibited badges (e.g., "Amazon's Choice" cannot be fabricated),
  text overlay allowed on images 2–7 but not on image 1.
- Output: `creative_renders` row per slot, same as today.

---

## 14. Recommended APIs / Data Sources

| Need | V1 (MVP) | V2/V3 |
|---|---|---|
| Competitor ASIN/listing data | A single licensed Amazon data API — evaluate **Rainforest API** or **Canopy API** (structured ASIN lookup: title, bullets, price, rating, reviews, images, BSR) | Add **Keepa** for price/BSR history; add **Jungle Scout API** or **Helium 10 (Cerebro/Xray)** for deeper market sizing |
| Keyword volume/competition | Manual CSV import (user exports from any tool they already own) | **Jungle Scout API**, **Helium 10 Cerebro**, or **Amazon Ads Keyword Recommendations API** for live data |
| Search Query Performance / Search Term Report | Not in V1 | **Amazon SP-API** (Reports API) — V3 |
| PPC performance | Not in V1 | **Amazon Ads API** — V3 |
| Review text (VoC) | Not in V1 | Licensed review data via the same data API used for listings (Rainforest/Canopy support review pulls), or Helium 10 "Review Insights" — V2 |
| Text generation | Existing `AI_PROVIDER` abstraction — Gemini (default) or OpenAI | unchanged |
| Image generation | Existing `IMAGE_PROVIDER` — Gemini Nano Banana 2 or OpenAI image model | unchanged |
| Compositing | Existing Sharp pipeline | unchanged |

Do not build a custom Amazon HTML scraper for V1 — ToS risk and brittleness outweigh
the cost savings versus a licensed API, and the schema in §8 is provider-agnostic
(`raw_data jsonb` holds whatever the chosen provider returns, mapped fields hold the
normalized subset the app actually uses).

---

## 15. Prompts (new, matching the existing style/rules in `lib/pipeline-prompts.ts`)

```ts
// lib/pipeline-prompts.ts additions

market_research: `You are Module 0: Amazon Market Research Engine. You receive a market
seed (keyword, category, ASIN or URL) plus a list of competitor listings already
normalized into title, bullets, price, rating, review_count, bsr, image_urls and
raw_data. Do not invent any competitor fact not present in the supplied data. Compute
and report: price positioning (distribution + where the seller's product would sit),
review/rating landscape, brand concentration (which brands dominate page-1 results and
by how much), keyword-in-listing coverage for every supplied keyword, and a claim/
messaging inventory extracted verbatim or near-verbatim from each competitor's title
and bullets, tagged by claim type. Separate FACT (present in supplied data) from
ESTIMATE (derived, e.g. demand proxied from review velocity — always label as
estimate with a confidence level) from GAP (data we do not have and should not guess).
Return structured JSON: price_positioning, review_landscape, brand_concentration,
keyword_coverage, claim_inventory, demand_estimate, evidence_gaps,
ready_for_opportunity_analysis.`,

opportunity_analysis: `You are Module 0b: Amazon Opportunity Analysis Engine. Consume
only the market_research output for this market. Identify saturated vs. underused
messaging (a claim used by more than half of competitors is saturated; a claim
plausible for this product but used by few or none is whitespace). Identify keyword
gaps (keywords with meaningful search volume that few competitor titles/bullets
target). Produce 5-8 scored opportunity territories, each with: territory_name,
what_the_opportunity_is, why_it_exists (must cite specific market_research evidence:
competitor names/claims/prices/keywords), target_customer_tension, score (0-10) and
evidence_confidence (Low/Medium/High) reflecting how much real data backs it, not
model confidence. Do not recommend a positioning that contradicts the seller's actual
product_truth. Return structured JSON: opportunities[], saturated_claims,
whitespace_claims, keyword_gaps, ready_for_decision_support.`,

decision_support: `You are Module 0c: Amazon Decision-Support Engine. Consume only
opportunities marked accepted and the full keyword list for this market. Convert
market understanding into concrete recommendations across these categories only:
keyword_priority (which keywords to prioritize in title/bullets/backend and why),
benefit_emphasis (which product benefits to lead with), competitor_weakness (specific,
evidenced gaps in named competitors), overused_angle (positioning to avoid because
the market is saturated on it), market_gap (a testable white-space idea),
listing_diagnosis (if the seller supplied their own current listing text, diagnose
what it's missing against the opportunities), next_test (a concrete next experiment).
Every recommendation must cite the opportunity_id or market_research evidence it is
based on and carry a confidence level. Do not recommend claims the product cannot
substantiate (check against product_truth/claims_allowed/claims_prohibited). Return
structured JSON: recommendations[] grouped by category, ready_for_listing_strategy.`,

listing_strategy: `You are Module 0d: Amazon Listing Strategy Engine. Consume only
accepted decision_support recommendations and approved research/product_truth.
Produce exactly 6 or 7 image slots in this fixed order and slot_type set: hero,
primary_benefit, proof_features, differentiation, lifestyle, usage, and optionally
trust_faq (omit only if the product genuinely has no distinct 7th idea — never pad).
For every slot return: objective, consumer_insight (which accepted recommendation or
opportunity it addresses — cite the id), headline, supporting_copy, visual_concept,
layout_direction, product_placement, image_prompt (environment/background only —
never ask the image model to invent the product package, logo or final on-image
copy), and compliance_notes (Amazon image-policy or claim-substantiation flags,
e.g. main image must be pure white background with no text/badges). Never invent a
claim not present in claims_allowed. Return structured JSON: strategy_summary,
images[6-7], ready_for_production.`,
```

The existing `research` and `production` prompts are reused with minor input-shape
notes only (they already support arbitrary `input.*` fields via the `theme` pattern
shown in the current prompts) — no rewrite required, just wire `input.opportunities`
and `input.decision_recommendations` into the existing `research` call, and wire
`listing_strategy_images` rows into `production` as today's `briefs` are.

---

## 16. Step-by-Step Development Plan

### Phase 0 — Schema & plumbing (3-5 days)
1. Write and run the migration in §8 (new tables + altered check constraints).
2. Add the 3 new `STAGES` entries + prompts (§9, §15) to `lib/stages.ts` /
   `lib/pipeline-prompts.ts`.
3. Extend `lib/db.ts` query helpers only if needed (likely not — existing pattern
   should already support parametrized queries against new tables).

### Phase 1 — Market Research ingestion (1-1.5 weeks)
4. Pick and integrate one competitor-data API (Rainforest or Canopy) behind
   `lib/competitor-scrape.ts`; support manual ASIN/URL paste in the UI first, provider
   call server-side.
5. Build `/api/markets` (create market) and `/api/markets/[id]/snapshot` (run
   `market_research` stage) route handlers.
6. Build `app/markets/[productId]/research/page.tsx` — snapshot view (price table,
   rating/review chart, brand concentration, claim inventory).
7. Keyword CSV import: `/api/keywords/import` + simple paste/upload UI.

### Phase 2 — Opportunity & Decision Support (1 week)
8. Implement `opportunity_analysis` stage call + `app/markets/[productId]/opportunities/page.tsx`
   with accept/reject per opportunity (reuse existing `decision` UI pattern from
   angles/hooks).
9. Implement `decision_support` stage call + `app/markets/[productId]/decision-support/page.tsx`,
   grouped by category, accept/reject per recommendation.

### Phase 3 — Listing Strategy (1-1.5 weeks)
10. Implement `listing_strategy` stage call producing `listing_strategies` +
    `listing_strategy_images`.
11. Build `app/markets/[productId]/strategy/page.tsx`: 7-card layout, per-card
    approve/edit/regenerate action, "approve all → send to production" action that
    creates one `briefs` row per approved `listing_strategy_images` row.

### Phase 4 — Creative generation wiring (3-5 days)
12. Map approved `listing_strategy_images` → existing `briefs`/`production_jobs`
    creation flow (thin adapter; production/Sharp pipeline itself is unchanged).
13. Add Amazon-specific constraints to the `production` prompt/brief template
    (white background on hero image, size minimums, no fabricated badges).
14. Verify regenerate-single-image flow end-to-end.

### Phase 5 — Hardening & MVP polish (1 week)
15. Compliance pass: claims validation against `claims_allowed`/`claims_prohibited`
    on every LLM output that touches copy (reuse existing product columns).
16. Empty/low-data states: what the UI shows when no keyword data or fewer than 3
    competitors are supplied (explicitly degrade gracefully — spec requires this).
17. End-to-end test: one real product, 3-5 competitors, manual keyword list, through
    to 7 generated images.
18. Update `README.md`/`ARCHITECTURE.md` to describe the full Amazon OS flow (this
    document becomes the source; those files get a short pointer + summary).

### Suggested sequencing note
Phases 0-3 have no dependency on the image-generation work and can be fully built,
demoed, and validated (with placeholder/manual creative output) before touching
Phase 4 — this lets you validate Layers A/B (research + decision-support) are actually
useful on real products before investing in the creative pipeline wiring, which is
the highest-risk assumption in the whole spec ("do sellers actually act on this
analysis"). Recommend treating Phases 0-3 as a demoable milestone on their own.

---

## 17. Compliance & Risk Notes
- Do not scrape amazon.com directly; use a licensed data API (§14) to avoid ToS
  violations and bot-detection breakage.
- Every AI-generated claim must be checked against `claims_allowed`/
  `claims_prohibited` before it reaches a headline/bullet/image — this is not
  optional for a system whose output touches live Amazon listings.
- Amazon image policy varies by category; `compliance_notes` per slot (§8, §15) is
  the enforcement point — treat it as a required field, not a nice-to-have.
- Demand/opportunity "scores" must always ship with their evidence and confidence
  level attached in the same payload — never a bare number in the UI, per the
  design principle in §1.2.
