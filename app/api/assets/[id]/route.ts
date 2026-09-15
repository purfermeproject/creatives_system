import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, query, withTransaction } from "@/lib/db";
import { deleteStorageFile } from "@/lib/local-storage";
import { getWorkspaceId } from "@/lib/workspace-id";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ error: "Local PostgreSQL is not configured." }, { status: 503 });
  try {
    const { id } = await context.params;
    const body = await req.json();
    const workspaceId = getWorkspaceId(body.workspaceId || null);
    const canonical = Boolean(body.is_canonical);
    const row = await withTransaction(async client => {
      const current = await client.query("select * from public.assets where workspace_id=$1 and id=$2", [workspaceId, id]);
      if (!current.rows[0]) throw new Error("Asset not found.");
      if (canonical) {
        await client.query(
          "update public.assets set is_canonical=false where workspace_id=$1 and product_id is not distinct from $2 and asset_type=$3",
          [workspaceId, current.rows[0].product_id, current.rows[0].asset_type]
        );
      }
      const updated = await client.query(
        "update public.assets set is_canonical=$3, updated_at=now() where workspace_id=$1 and id=$2 returning *",
        [workspaceId, id, canonical]
      );
      return updated.rows[0];
    });
    return NextResponse.json(row);
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Could not update asset." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ error: "Local PostgreSQL is not configured." }, { status: 503 });
  try {
    const { id } = await context.params;
    const url = new URL(req.url);
    const workspaceId = getWorkspaceId(url.searchParams.get("workspaceId"));
    const result = await query("delete from public.assets where workspace_id=$1 and id=$2 returning storage_path", [workspaceId, id]);
    if (!result.rows[0]) return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    await deleteStorageFile(result.rows[0].storage_path).catch(()=>{});
    return NextResponse.json({ ok:true });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Could not delete asset." }, { status: 500 });
  }
}
