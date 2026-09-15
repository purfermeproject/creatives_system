import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, query, withTransaction } from "@/lib/db";
import { writeStorageFile } from "@/lib/local-storage";
import { getWorkspaceId } from "@/lib/workspace-id";

export const runtime = "nodejs";
const allowed = new Set(["front_pack","back_pack","cookie_reference","ingredient_reference","logo","creative","other"]);

export async function POST(req: NextRequest) {
  if (!hasDatabase()) return NextResponse.json({ error: "Local PostgreSQL is required for persistent asset upload." }, { status: 503 });
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const brandId = String(form.get("brandId") || "PF");
    const productId = String(form.get("productId") || "PF-COOKIE-BRK");
    const assetType = String(form.get("assetType") || "other");
    const workspaceId = getWorkspaceId(String(form.get("workspaceId") || "") || null);
    const canonical = String(form.get("canonical") || "false") === "true";
    if (!file || !allowed.has(assetType)) return NextResponse.json({ error: "Valid file and assetType are required." }, { status: 400 });
    if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "File too large. Max 20MB." }, { status: 400 });

    const bytes = Buffer.from(await file.arrayBuffer());
    const storagePath = await writeStorageFile({
      workspaceId, brandId, productId, category: assetType, fileName: file.name, bytes
    });

    const row = await withTransaction(async client => {
      if (canonical) {
        await client.query(
          "update public.assets set is_canonical=false where workspace_id=$1 and product_id=$2 and asset_type=$3 and is_canonical=true",
          [workspaceId, productId, assetType]
        );
      }
      const inserted = await client.query(
        `insert into public.assets
        (workspace_id,brand_id,product_id,asset_type,storage_path,is_canonical,source,metadata)
        values ($1,$2,$3,$4,$5,$6,'user_upload',$7::jsonb)
        returning *`,
        [workspaceId, brandId, productId, assetType, storagePath, canonical, JSON.stringify({ filename:file.name, mime:file.type, size:file.size })]
      );
      return inserted.rows[0];
    });
    return NextResponse.json(row);
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || "Upload failed" }, { status: 500 });
  }
}
