import { brand, product, initialStages } from "./demo-data";
import { hasDatabase, query } from "./db";
import { STAGES } from "./stages";
import { getWorkspaceId } from "./workspace-id";

export async function getWorkspace(
  brandId = process.env.DEMO_BRAND_ID || "PF",
  productId = process.env.DEMO_PRODUCT_ID || "PF-COOKIE-BRK",
  workspaceId = getWorkspaceId()
) {
  if (!hasDatabase()) return { mode: "demo", brand, product, stages: initialStages, assets: [], latestRuns: [] };

  const [bRes, pRes, runsRes, assetsRes] = await Promise.all([
    query("select * from public.brands where workspace_id=$1 and id=$2 limit 1", [workspaceId, brandId]),
    query("select * from public.products where workspace_id=$1 and id=$2 limit 1", [workspaceId, productId]),
    query("select id,stage,status,approved,created_at,output_json from public.pipeline_runs where workspace_id=$1 and brand_id=$2 and product_id=$3 order by created_at desc limit 50", [workspaceId, brandId, productId]),
    query("select id,asset_type,is_canonical,storage_path,source,created_at from public.assets where workspace_id=$1 and product_id=$2 order by created_at desc", [workspaceId, productId])
  ]);

  const runs = runsRes.rows || [];
  const assets = assetsRes.rows || [];
  const stageState = STAGES.map(s => {
    const latest = runs.find((r:any) => r.stage === s.key);
    return {
      id: s.number,
      key: s.key,
      title: s.title,
      description: latest ? `Latest run: ${latest.status}${latest.approved ? " · approved" : ""}` : "No run yet",
      status: latest?.approved ? "complete" : latest?.status === "blocked" ? "blocked" : latest ? "ready" : "draft"
    };
  });

  return {
    mode: "live",
    brand: bRes.rows[0] || brand,
    product: pRes.rows[0] || product,
    stages: stageState,
    assets,
    latestRuns: runs
  };
}
