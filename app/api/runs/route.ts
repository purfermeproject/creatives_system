import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, query } from "@/lib/db";
import { getWorkspaceId } from "@/lib/workspace-id";

export async function GET(req: NextRequest) {
  if (!hasDatabase()) return NextResponse.json({ mode: "demo", runs: [] });
  const workspaceId = getWorkspaceId(req.nextUrl.searchParams.get("workspaceId"));
  const brand = req.nextUrl.searchParams.get("brand");
  const product = req.nextUrl.searchParams.get("product");
  const values:any[] = [workspaceId];
  const where = ["workspace_id=$1"];
  if (brand) { values.push(brand); where.push(`brand_id=$${values.length}`); }
  if (product) { values.push(product); where.push(`product_id=$${values.length}`); }
  try {
    const result = await query(`select * from public.pipeline_runs where ${where.join(" and ")} order by created_at desc limit 100`, values);
    return NextResponse.json({ mode: "live", runs: result.rows });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Could not load runs" }, { status: 500 });
  }
}
