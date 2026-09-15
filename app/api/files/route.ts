import { NextRequest, NextResponse } from "next/server";
import { readStorageFile } from "@/lib/local-storage";

export const runtime="nodejs";

export async function GET(req:NextRequest){
  const p=req.nextUrl.searchParams.get("path");
  if(!p) return NextResponse.json({error:"path is required"},{status:400});
  try{
    const bytes=await readStorageFile(p);
    const ext=p.toLowerCase().split(".").pop();
    const type=ext==="png"?"image/png":ext==="jpg"||ext==="jpeg"?"image/jpeg":ext==="webp"?"image/webp":ext==="pdf"?"application/pdf":"application/octet-stream";
    return new NextResponse(bytes,{headers:{"Content-Type":type,"Cache-Control":"private, max-age=60"}});
  }catch(e:any){
    return NextResponse.json({error:e?.message||"File not found"},{status:404});
  }
}
