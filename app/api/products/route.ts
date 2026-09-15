import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, query } from "@/lib/db";
import { getWorkspaceId } from "@/lib/workspace-id";

export const runtime = "nodejs";

function asJson(value: unknown, fallback: unknown) {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(String(value)); } catch { return fallback; }
}

export async function GET(req: NextRequest) {
  if (!hasDatabase()) return NextResponse.json({ error: "Local PostgreSQL is not configured." }, { status: 503 });
  const url = new URL(req.url);
  const workspaceId = getWorkspaceId(url.searchParams.get("workspaceId"));
  const brandId = url.searchParams.get("brand") || "PF";
  const result = await query(
    `select * from public.products where workspace_id=$1 and brand_id=$2
     order by case status when 'active' then 1 when 'planned' then 2 when 'draft' then 3 when 'inactive' then 4 else 5 end, name`,
    [workspaceId, brandId]
  );
  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  if (!hasDatabase()) return NextResponse.json({ error: "Local PostgreSQL is not configured." }, { status: 503 });
  try {
    const body = await req.json();
    const workspaceId = getWorkspaceId(body.workspaceId || null);
    const brandId = String(body.brand_id || "PF");
    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    if (!id || !name) return NextResponse.json({ error: "Product ID and name are required." }, { status: 400 });
    const result = await query(
      `insert into public.products
      (id,workspace_id,brand_id,name,sku,mrp,selling_price,pack_size,product_truth,claims_allowed,claims_prohibited,status)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12)
      returning *`,
      [
        id, workspaceId, brandId, name, body.sku || null,
        body.mrp === "" || body.mrp == null ? null : Number(body.mrp),
        body.selling_price === "" || body.selling_price == null ? null : Number(body.selling_price),
        body.pack_size || null,
        JSON.stringify(asJson(body.product_truth, {})),
        JSON.stringify(asJson(body.claims_allowed, [])),
        JSON.stringify(asJson(body.claims_prohibited, [])),
        body.status || "draft"
      ]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Could not create product." }, { status: 500 });
  }
}
