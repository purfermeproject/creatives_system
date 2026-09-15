import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, query } from "@/lib/db";
import { getWorkspaceId } from "@/lib/workspace-id";

export const runtime = "nodejs";

function asJson(value: unknown, fallback: unknown) {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(String(value)); } catch { return fallback; }
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ error: "Local PostgreSQL is not configured." }, { status: 503 });
  try {
    const { id } = await context.params;
    const body = await req.json();
    const workspaceId = getWorkspaceId(body.workspaceId || null);
    const result = await query(
      `update public.products set
        name=$3, sku=$4, mrp=$5, selling_price=$6, pack_size=$7,
        product_truth=$8::jsonb, claims_allowed=$9::jsonb, claims_prohibited=$10::jsonb, status=$11,
        updated_at=now()
       where workspace_id=$1 and id=$2
       returning *`,
      [
        workspaceId, id, String(body.name || "").trim(), body.sku || null,
        body.mrp === "" || body.mrp == null ? null : Number(body.mrp),
        body.selling_price === "" || body.selling_price == null ? null : Number(body.selling_price),
        body.pack_size || null,
        JSON.stringify(asJson(body.product_truth, {})),
        JSON.stringify(asJson(body.claims_allowed, [])),
        JSON.stringify(asJson(body.claims_prohibited, [])),
        body.status || "draft"
      ]
    );
    if (!result.rows[0]) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Could not update product." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ error: "Local PostgreSQL is not configured." }, { status: 503 });
  try {
    const { id } = await context.params;
    const url = new URL(req.url);
    const workspaceId = getWorkspaceId(url.searchParams.get("workspaceId"));
    const dependencies = await query(
      `select
        (select count(*) from public.assets where workspace_id=$1 and product_id=$2) as assets,
        (select count(*) from public.pipeline_runs where workspace_id=$1 and product_id=$2) as runs`,
      [workspaceId, id]
    );
    const dep = dependencies.rows[0];
    if (Number(dep.assets) > 0 || Number(dep.runs) > 0) {
      return NextResponse.json({ error: "This product already has assets or pipeline history. Archive it instead of deleting it." }, { status: 409 });
    }
    const result = await query("delete from public.products where workspace_id=$1 and id=$2 returning id", [workspaceId, id]);
    if (!result.rows[0]) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ ok: true, id });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Could not delete product." }, { status: 500 });
  }
}
