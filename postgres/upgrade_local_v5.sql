-- Run this ONCE in creative_os_db if you already created the database using the earlier local schema.
-- Align pipeline stage keys with the browser application.

begin;

alter table public.pipeline_runs drop constraint if exists pipeline_runs_stage_check;
alter table public.pipeline_runs
  add constraint pipeline_runs_stage_check
  check (stage in ('research','angles','hooks','concepts','briefs','production','qa','testing','performance','learning','expansion'));

commit;

select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid='public.pipeline_runs'::regclass
  and conname='pipeline_runs_stage_check';
