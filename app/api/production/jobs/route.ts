import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, query } from "@/lib/db";
import { getWorkspaceId } from "@/lib/workspace-id";

export async function GET(req: NextRequest) {
  if (!hasDatabase()) return NextResponse.json({ mode:"demo", jobs:[] });
  const productId = req.nextUrl.searchParams.get("productId") || "PF-COOKIE-BRK";
  const workspaceId = getWorkspaceId(req.nextUrl.searchParams.get("workspaceId"));
  try {
    const jobsResult = await query(
      `select j.id,j.brief_id,j.version,j.status,j.environment_prompt,j.negative_prompt,
              j.product_instructions,j.export_spec,j.output_asset_id,j.created_at,
              b.exact_hook,b.support_copy,b.proof_lines,b.cta,b.product_scale,b.format
       from public.production_jobs j
       left join public.briefs b on b.id=j.brief_id
       where j.workspace_id=$1
       order by j.created_at desc`,
      [workspaceId]
    );
    const jobs = jobsResult.rows.map((r:any)=>({
      id:r.id, brief_id:r.brief_id, version:r.version, status:r.status,
      environment_prompt:r.environment_prompt, negative_prompt:r.negative_prompt,
      product_instructions:r.product_instructions, export_spec:r.export_spec,
      output_asset_id:r.output_asset_id, created_at:r.created_at,
      briefs:{ exact_hook:r.exact_hook, support_copy:r.support_copy, proof_lines:r.proof_lines, cta:r.cta, product_scale:r.product_scale, format:r.format }
    }));
    const assets = await query(
      "select asset_type,is_canonical from public.assets where workspace_id=$1 and product_id=$2 and is_canonical=true",
      [workspaceId, productId]
    );
    return NextResponse.json({ mode:"live", jobs, canonicalAssets:assets.rows });
  } catch (e:any) {
    return NextResponse.json({ error:e?.message || "Could not load production jobs" }, { status:500 });
  }
}
