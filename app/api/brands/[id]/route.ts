import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, query } from "@/lib/db";
import { getWorkspaceId } from "@/lib/workspace-id";

export const runtime = "nodejs";

function parseJson(value: unknown, fallback: unknown) {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(String(value)); } catch { return fallback; }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ error: "Local PostgreSQL is not configured." }, { status: 503 });
  const { id } = await context.params;
  const url = new URL(req.url);
  const workspaceId = getWorkspaceId(url.searchParams.get("workspaceId"));
  const result = await query("select * from public.brands where workspace_id=$1 and id=$2 limit 1", [workspaceId, id]);
  if (!result.rows[0]) return NextResponse.json({ error: "Brand not found." }, { status: 404 });
  return NextResponse.json(result.rows[0]);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ error: "Local PostgreSQL is not configured." }, { status: 503 });
  try {
    const { id } = await context.params;
    const body = await req.json();
    const workspaceId = getWorkspaceId(body.workspaceId || null);
    const result = await query(
      `update public.brands set
        name=$3, category=$4, positioning=$5, brand_promise=$6, differentiator=$7,
        tone=$8, visual_identity=$9::jsonb, guardrails=$10::jsonb, updated_at=now()
       where workspace_id=$1 and id=$2 returning *`,
      [
        workspaceId, id, body.name, body.category, body.positioning, body.brand_promise,
        body.differentiator, body.tone,
        JSON.stringify(parseJson(body.visual_identity, {})),
        JSON.stringify(parseJson(body.guardrails, {}))
      ]
    );
    if (!result.rows[0]) return NextResponse.json({ error: "Brand not found." }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Could not update brand." }, { status: 500 });
  }
}
