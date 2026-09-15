import { NextRequest, NextResponse } from "next/server";
import { getWorkspace } from "@/lib/workspace";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const data = await getWorkspace(url.searchParams.get("brand") || undefined, url.searchParams.get("product") || undefined);
  return NextResponse.json(data);
}
