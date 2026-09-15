import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

export type AIProvider = "gemini" | "openai" | "demo";

function parseJSON(text: string) {
  try { return JSON.parse(text); } catch {}
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try { return JSON.parse(fenced[1]); } catch {}
  }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(text.slice(first, last + 1)); } catch {}
  }
  return { raw: text };
}

export function configuredProvider(): AIProvider {
  const requested = String(process.env.AI_PROVIDER || "").toLowerCase();
  if (requested === "gemini") return process.env.GEMINI_API_KEY ? "gemini" : "demo";
  if (requested === "openai") return process.env.OPENAI_API_KEY ? "openai" : "demo";
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "demo";
}

async function runGemini(stage: string, systemPrompt: string, input: unknown) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured.");
  const ai = new GoogleGenAI({ apiKey: key });
  const useSearch = stage === "research" && String(process.env.GEMINI_ENABLE_SEARCH || "true").toLowerCase() !== "false";
  const combined = [
    systemPrompt,
    "\nSYSTEM OUTPUT REQUIREMENT:\nReturn one valid JSON object only. Do not use markdown fences. Do not add commentary outside the JSON.",
    `\nINPUT:\n${JSON.stringify(input, null, 2)}`,
  ].join("\n");

  const interaction: any = await ai.interactions.create({
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    input: combined,
    ...(useSearch ? { tools: [{ type: "google_search" }] } : {}),
  } as any);
  const text = interaction?.output_text || "";
  if (!text) throw new Error("Gemini returned an empty response.");
  return { mode: "live", provider: "gemini", model: process.env.GEMINI_MODEL || "gemini-3.6-flash", stage, output: parseJSON(text) };
}

async function runOpenAI(stage: string, systemPrompt: string, input: unknown) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured.");
  const client = new OpenAI({ apiKey: key });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5.6",
    reasoning: { effort: "medium" },
    input: [
      { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
      { role: "user", content: [{ type: "input_text", text: `Return valid JSON only.\n\nINPUT:\n${JSON.stringify(input, null, 2)}` }] }
    ]
  });
  return { mode: "live", provider: "openai", model: process.env.OPENAI_MODEL || "gpt-5.6", stage, output: parseJSON(response.output_text) };
}

export async function runAIStage(stage: string, systemPrompt: string, input: unknown) {
  const provider = configuredProvider();
  if (provider === "gemini") return runGemini(stage, systemPrompt, input);
  if (provider === "openai") return runOpenAI(stage, systemPrompt, input);
  return { mode: "demo", provider: "demo", stage, output: demoOutput(stage) };
}

function demoOutput(stage: string) {
  const map: Record<string, unknown> = {
    research: { ready_for_module_2: true, opportunities: [{id:"OPP-001",territory:"Specialty Coffee Ritual",score:9.0},{id:"OPP-002",territory:"Imperfect Morning",score:9.0},{id:"OPP-003",territory:"Claim-to-Proof",score:9.0}] },
    angles: { ready_for_module_3: true, shortlisted: ["Imperfect Morning Backup","Proof Over Promises","Coffee Companion Upgrade","Health Without The Health Persona","Make Better Food A Ritual"] },
    hooks: { ready_for_module_4: true, shortlisted: ["Breakfast had a plan. Monday had other ideas.","Healthy is easy to print on a packet.","Your coffee upgraded. Did your cookie?"] },
    concepts: { ready_for_brief: true, shortlisted: ["Monday Table","Claim / Evidence Split","Coffee Upgrade Table","No Wellness Theatre"] },
    briefs: { ready_for_production: false, ready_count: 5, blockers: ["canonical front pack","real cookie source"] },
    production: { ready_for_qa: false, jobs_created: 5, blocker: "source product assets / finished renders required" },
    qa: { status: "blocked", reason: "No rendered creative supplied" },
    testing: { tests: [] },
    learning: { learnings: [] },
    expansion: { variants: [] }
  };
  return map[stage] ?? { ok: true };
}
