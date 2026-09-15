import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, query } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { runId, approved = true } = await req.json();
  if (!hasDatabase()) return NextResponse.json({ mode: "demo", runId, approved });
  if (!runId) return NextResponse.json({ error: "runId required" }, { status: 400 });
  try {
    const result = await query(
      "update public.pipeline_runs set approved=$2, approved_at=case when $2 then now() else null end where id=$1 returning *",
      [runId, approved]
    );
    if (!result.rows[0]) return NextResponse.json({ error: "Run not found" }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Approval failed" }, { status: 500 });
  }
}
