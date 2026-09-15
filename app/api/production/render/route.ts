import { NextRequest, NextResponse } from "next/server";
import { hasDatabase, query, withTransaction } from "@/lib/db";
import { compositeCreative, generateEnvironment, uploadRender } from "@/lib/image-production";
import { getWorkspaceId } from "@/lib/workspace-id";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  if (!hasDatabase()) return NextResponse.json({ error:"Local PostgreSQL is required for live production." },{status:503});
  let jobId: string | null = null;
  try {
    const body = await req.json();
    jobId = body.jobId;
    const brandId = body.brandId || "PF";
    const productId = body.productId || "PF-COOKIE-BRK";
    const workspaceId = getWorkspaceId(body.workspaceId);
    if (!jobId) return NextResponse.json({error:"jobId is required"},{status:400});

    const jobResult = await query(
      `select j.*, b.exact_hook,b.support_copy,b.proof_lines,b.cta,b.product_scale,b.format
       from public.production_jobs j
       left join public.briefs b on b.id=j.brief_id
       where j.workspace_id=$1 and j.id=$2 limit 1`,
      [workspaceId, jobId]
    );
    const job:any = jobResult.rows[0];
    if(!job) return NextResponse.json({error:"Production job not found"},{status:404});

    const assetResult = await query(
      "select asset_type from public.assets where workspace_id=$1 and product_id=$2 and is_canonical=true",
      [workspaceId, productId]
    );
    const types=new Set(assetResult.rows.map((x:any)=>x.asset_type));
    const missing=["front_pack","cookie_reference"].filter(t=>!types.has(t));
    if(missing.length) return NextResponse.json({status:"blocked",blocker:`Missing canonical assets: ${missing.join(", ")}`},{status:409});

    await query("update public.production_jobs set status='rendering', error_message=null where workspace_id=$1 and id=$2",[workspaceId,jobId]);
    const environment=await generateEnvironment(job.environment_prompt,job.negative_prompt);
    const creativeId=job.export_spec?.creative_id || job.id;
    const environmentPath=await uploadRender({workspaceId,brandId,productId,jobId,creativeId,bytes:environment,kind:"environment"});

    const proof=Array.isArray(job.proof_lines)?job.proof_lines.join(" · "):String(job.proof_lines||"");
    const composite=await compositeCreative({
      background:environment,workspaceId,productId,
      hook:job.exact_hook||"",supportCopy:job.support_copy||"",proof,cta:job.cta||"",
      productScale:Number(job.product_scale||30),includeCookie:true
    });
    const creativePath=await uploadRender({workspaceId,brandId,productId,jobId,creativeId,bytes:composite,kind:"creative"});

    const assetId=await withTransaction(async client=>{
      const asset=await client.query(
        `insert into public.assets
        (workspace_id,brand_id,product_id,asset_type,storage_path,is_canonical,source,metadata)
        values ($1,$2,$3,'creative',$4,false,'module_6_renderer',$5::jsonb)
        returning id`,
        [workspaceId,brandId,productId,creativePath,JSON.stringify({job_id:jobId,brief_id:job.brief_id,environment_path:environmentPath,dimensions:"1080x1350",version:job.version})]
      );
      const id=asset.rows[0].id;
      await client.query("update public.production_jobs set status='rendered',output_asset_id=$3 where workspace_id=$1 and id=$2",[workspaceId,jobId,id]);
      await client.query(
        `insert into public.creative_renders
        (workspace_id,production_job_id,product_id,environment_path,creative_path,width,height,status,metadata)
        values ($1,$2,$3,$4,$5,1080,1350,'rendered',$6::jsonb)`,
        [workspaceId,jobId,productId,environmentPath,creativePath,JSON.stringify({creative_id:creativeId})]
      );
      return id;
    });

    return NextResponse.json({ok:true,jobId,status:"rendered",environmentPath,creativePath,assetId});
  } catch(e:any){
    if(jobId){
      try{await query("update public.production_jobs set status='failed',error_message=$2 where id=$1",[jobId,e?.message||"Render failed"]);}catch{}
    }
    return NextResponse.json({error:e?.message||"Render failed"},{status:500});
  }
}
