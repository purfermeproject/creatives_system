import { NextRequest, NextResponse } from "next/server";
import { prompts } from "@/lib/pipeline-prompts";
import { runAIStage } from "@/lib/ai";
import { hasDatabase, query } from "@/lib/db";
import { previousStage, StageKey, STAGES } from "@/lib/stages";
import { getWorkspaceId } from "@/lib/workspace-id";

async function checkGate(stage: StageKey, workspaceId: string, brandId: string, productId: string) {
  if (!hasDatabase()) return { ok: true };
  const previous = previousStage(stage);
  if (previous) {
    const r = await query(
      "select id,approved,status from public.pipeline_runs where workspace_id=$1 and brand_id=$2 and product_id=$3 and stage=$4 order by created_at desc limit 1",
      [workspaceId, brandId, productId, previous]
    );
    if (!r.rows[0]?.approved) return { ok: false, blocker: `Approve the latest ${previous} run first.` };
  }
  if (stage === "production") {
    const r = await query(
      "select asset_type,is_canonical from public.assets where workspace_id=$1 and product_id=$2 and is_canonical=true",
      [workspaceId, productId]
    );
    const types = new Set(r.rows.map((a:any) => a.asset_type));
    const missing = ["front_pack", "cookie_reference"].filter(t => !types.has(t));
    if (missing.length) return { ok: false, blocker: `Missing canonical assets: ${missing.join(", ")}` };
  }
  return { ok: true };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const stage = String(body.stage || "") as StageKey;
    if (!STAGES.some(s => s.key === stage) || !prompts[stage]) {
      return NextResponse.json({ error: "Unknown or non-AI stage" }, { status: 400 });
    }

    const workspaceId = getWorkspaceId(body.workspaceId);
    const brandId = body.brandId || process.env.DEMO_BRAND_ID || "PF";
    const productId = body.productId || process.env.DEMO_PRODUCT_ID || "PF-COOKIE-BRK";
    const gate = await checkGate(stage, workspaceId, brandId, productId);
    if (!gate.ok) return NextResponse.json({ status: "blocked", blocker: gate.blocker }, { status: 409 });

    let prompt = prompts[stage];
    if (hasDatabase()) {
      const spec = await query(
        "select prompt from public.prompt_specs where workspace_id=$1 and stage=$2 and is_active=true order by version desc limit 1",
        [workspaceId, stage]
      );
      if (spec.rows[0]?.prompt) prompt = spec.rows[0].prompt;
    }

    const context = {
      workspaceId, brandId, productId, stage,
      userInput: body.input || {},
      lineage: body.lineage || {},
      instruction: "Respect upstream approvals, source-asset gates and evidence confidence. Return JSON only."
    };
    const result = await runAIStage(stage, prompt, context);

    let runId: string | null = null;
    if (hasDatabase()) {
      const inserted = await query(
        `insert into public.pipeline_runs
        (workspace_id,brand_id,product_id,stage,status,input_json,output_json,approved)
        values ($1,$2,$3,$4,'complete',$5::jsonb,$6::jsonb,false)
        returning id`,
        [workspaceId, brandId, productId, stage, JSON.stringify(context), JSON.stringify(result)]
      );
      runId = inserted.rows[0]?.id || null;
    }
    return NextResponse.json({ ...result, runId, approved: false });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Stage run failed" }, { status: 500 });
  }
}
