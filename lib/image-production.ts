import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import sharp from "sharp";
import { query } from "./db";
import { readStorageFile, writeRenderFile } from "./local-storage";
import { getWorkspaceId } from "./workspace-id";

export type ProductionJob = {
  id: string;
  brief_id: string;
  version: string;
  status: string;
  environment_prompt: string;
  negative_prompt?: string | null;
  product_instructions?: string | null;
  composite_order?: string[] | null;
  export_spec?: Record<string, unknown> | null;
};

function selectedImageProvider() {
  const requested = String(process.env.IMAGE_PROVIDER || process.env.AI_PROVIDER || "").toLowerCase();
  if (requested === "gemini") return "gemini";
  if (requested === "openai") return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "openai";
}

export async function generateEnvironment(prompt: string, negativePrompt?: string | null) {
  const fullPrompt = [
    prompt,
    "IMPORTANT: Generate only the environment/background. Do not render any product packaging, brand logo, readable copy, nutrition panel or branded food pack. Leave clean negative space for later product compositing and exact typography.",
    negativePrompt ? `FORBIDDEN: ${negativePrompt}` : "",
  ].filter(Boolean).join("\n\n");

  if (selectedImageProvider() === "gemini") {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is required for Gemini image production.");
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image",
      contents: fullPrompt,
      config: { responseModalities: ["IMAGE"] },
    });
    const data = response.data;
    if (!data) throw new Error("Gemini image generation returned no image payload.");
    return Buffer.from(data, "base64");
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is required for OpenAI image production.");
  const client = new OpenAI({ apiKey: key });
  const result: any = await client.images.generate({
    model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
    prompt: fullPrompt,
    size: (process.env.OPENAI_IMAGE_SIZE || "1024x1536") as any,
    quality: (process.env.OPENAI_IMAGE_QUALITY || "high") as any,
    output_format: "png" as any,
  } as any);

  const b64 = result?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI image generation returned no image payload.");
  return Buffer.from(b64, "base64");
}

async function canonicalAsset(productId: string, assetType: string, workspaceId = getWorkspaceId()) {
  const r = await query(
    `select id,storage_path,metadata from public.assets
     where workspace_id=$1 and product_id=$2 and asset_type=$3 and is_canonical=true
     order by created_at desc limit 1`,
    [workspaceId, productId, assetType]
  );
  const data = r.rows[0];
  if (!data?.storage_path) throw new Error(`Missing canonical ${assetType} asset.`);
  return { row:data, bytes:await readStorageFile(data.storage_path) };
}

function escapeXml(s: string) {
  return s.replace(/[<>&'\"]/g, c => ({"<":"&lt;", ">":"&gt;", "&":"&amp;", "'":"&apos;", '"':"&quot;"}[c]!));
}

function svgText(text: string, x: number, y: number, width: number, fontSize: number, family: string, weight = 400, color = "#36013F") {
  const words = text.split(/\s+/);
  const approx = Math.max(8, Math.floor(width / (fontSize * 0.55)));
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > approx && line) { lines.push(line); line = word; }
    else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines.map((l,i)=>`<text x="${x}" y="${y + i * fontSize * 1.12}" font-family="${family}" font-size="${fontSize}" font-weight="${weight}" fill="${color}">${escapeXml(l)}</text>`).join("\n");
}

export async function compositeCreative(args: {
  background: Buffer;
  workspaceId?: string;
  productId: string;
  hook: string;
  supportCopy?: string;
  proof?: string;
  cta?: string;
  productScale?: number;
  productPlacement?: "lower-right" | "right" | "center-right";
  includeCookie?: boolean;
}) {
  const W=1080, H=1350;
  const bg = await sharp(args.background).resize(W,H,{fit:"cover"}).png().toBuffer();
  const workspaceId = getWorkspaceId(args.workspaceId);
  const pack = await canonicalAsset(args.productId,"front_pack",workspaceId);
  const cookie = args.includeCookie===false ? null : await canonicalAsset(args.productId,"cookie_reference",workspaceId);

  const scale = Math.min(0.44, Math.max(0.20, (args.productScale || 30)/100));
  const targetPackW = Math.round(W*scale);
  const packPng = await sharp(pack.bytes).resize({width:targetPackW,fit:"inside",withoutEnlargement:true}).png().toBuffer();
  const pm = await sharp(packPng).metadata();
  const packW=pm.width||targetPackW, packH=pm.height||Math.round(targetPackW*1.25);
  const packLeft=W-packW-78, packTop=H-packH-110;
  const composites: sharp.OverlayOptions[]=[{input:packPng,left:packLeft,top:packTop}];

  if(cookie){
    const cookieW=Math.round(W*0.16);
    const cookiePng=await sharp(cookie.bytes).resize({width:cookieW,fit:"inside",withoutEnlargement:true}).png().toBuffer();
    const cm=await sharp(cookiePng).metadata();
    composites.push({input:cookiePng,left:Math.max(20,packLeft-Math.round(cookieW*0.45)),top:Math.min(H-(cm.height||cookieW)-40,packTop+Math.round(packH*0.66))});
  }

  const textSvg=Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    ${svgText(args.hook,78,145,570,66,"Georgia",700)}
    ${args.supportCopy ? svgText(args.supportCopy,80,315,530,30,"Arial",400,"#3D3340") : ""}
    ${args.proof ? svgText(args.proof,80,1110,560,27,"Arial",600,"#36013F") : ""}
    ${args.cta ? `<rect x="78" y="1190" rx="22" ry="22" width="250" height="58" fill="#36013F"/>${svgText(args.cta,104,1229,210,25,"Arial",700,"#FBF3E3")}` : ""}
  </svg>`);
  composites.push({input:textSvg,left:0,top:0});
  return sharp(bg).composite(composites).png().toBuffer();
}

export async function uploadRender(args:{workspaceId?:string;brandId:string;productId:string;jobId:string;creativeId:string;bytes:Buffer;kind:"environment"|"creative"}){
  const workspaceId=getWorkspaceId(args.workspaceId);
  const fileName=`${args.creativeId}-${args.kind}-${Date.now()}.png`;
  return writeRenderFile({workspaceId,brandId:args.brandId,productId:args.productId,jobId:args.jobId,fileName,bytes:args.bytes});
}
