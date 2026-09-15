import { NextResponse } from "next/server";
import { hasDatabase, query } from "@/lib/db";
import { configuredProvider } from "@/lib/ai";

export async function GET() {
  let databaseOk = false;
  let databaseError: string | null = null;
  if (hasDatabase()) {
    try {
      await query("select 1 as ok");
      databaseOk = true;
    } catch (e:any) {
      databaseError = e?.message || "Database connection failed";
    }
  }
  const requestedImageProvider = String(process.env.IMAGE_PROVIDER || process.env.AI_PROVIDER || "").toLowerCase();
  const imageProvider = requestedImageProvider === "openai" || requestedImageProvider === "gemini"
    ? requestedImageProvider
    : (process.env.GEMINI_API_KEY ? "gemini" : "openai");

  return NextResponse.json({
    ok: true,
    service: "creative-os-local-v7",
    aiProvider: configuredProvider(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    textModel: configuredProvider() === "gemini" ? (process.env.GEMINI_MODEL || "gemini-3.6-flash") : (process.env.OPENAI_MODEL || "gpt-5.6"),
    imageProvider,
    imageModel: imageProvider === "openai" ? (process.env.OPENAI_IMAGE_MODEL || "gpt-image-2") : (process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image"),
    databaseConfigured: hasDatabase(),
    databaseOk,
    databaseError,
    storageMode: "local-filesystem"
  });
}
