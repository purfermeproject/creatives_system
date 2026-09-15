export const brand = {
  id: "PF",
  name: "Pur’ Ferme Project",
  category: "Functional foods",
  positioning: "Clean-label, health-first everyday nutrition",
  tone: "Premium, intelligent, calm, modern",
  primaryColor: "#36013F",
  secondaryColor: "#FBF3E3"
};

export const product = {
  id: "PF-COOKIE-BRK",
  name: "Millet & Oats Breakfast Cookies",
  sku: "Cookies_Breakfast",
  mrp: 339,
  packSize: "240 g",
  proof: ["Millet + oats", "No maida", "No refined sugar", "No palm oil"],
  blockedAssets: ["Canonical front pack", "Real breakfast-cookie photo"]
};

export type StageStatus = "complete" | "ready" | "blocked" | "draft";
export type PipelineStage = {
  id: number;
  key: string;
  title: string;
  description: string;
  status: StageStatus;
  count?: string;
};

export const initialStages: PipelineStage[] = [
  { id: 1, key: "research", title: "Research Engine", description: "Product truth, buyer tensions, competitors, whitespace", status: "complete", count: "6 opportunities" },
  { id: 2, key: "angles", title: "Angle Engine", description: "Convert opportunities into scored strategic angles", status: "complete", count: "7 shortlisted" },
  { id: 3, key: "hooks", title: "Hook Engine", description: "Generate and score hook families", status: "complete", count: "16 shortlisted" },
  { id: 4, key: "concepts", title: "Concept Engine", description: "Static-native visual concepts", status: "complete", count: "8 shortlisted" },
  { id: 5, key: "briefs", title: "Creative Brief Engine", description: "Production-ready design instructions", status: "complete", count: "5 ready / 3 blocked" },
  { id: 6, key: "production", title: "Image Production", description: "Generate environments, composite real products, export", status: "blocked", count: "2 source assets needed" },
  { id: 7, key: "qa", title: "QA Engine", description: "Creative quality, claim and product-fidelity checks", status: "draft" },
  { id: 8, key: "testing", title: "Test Matrix", description: "Controlled hypotheses and media tests", status: "draft" },
  { id: 9, key: "performance", title: "Performance Ingestion", description: "CTR, CPC, CVR, CPA, ROAS and creative lineage", status: "draft" },
  { id: 10, key: "learning", title: "Learning Engine", description: "Turn test evidence into reusable creative rules", status: "draft" },
  { id: 11, key: "expansion", title: "Winner Expansion", description: "Create controlled variants of winning components", status: "draft" }
];

export const shortlistedConcepts = [
  ["C001", "Monday Table", "Controlled Chaos", "Breakfast had a plan. Monday had other ideas.", "P1"],
  ["C004", "Claim / Evidence Split", "Proof-Led", "Healthy is easy to print on a packet.", "P1"],
  ["C007", "Coffee Upgrade Table", "Comparison-to-Self", "Your coffee upgraded. Did your cookie?", "P1"],
  ["C011", "No Wellness Theatre", "Typography-Led", "Better food. Less wellness theatre.", "P1"],
  ["C012", "Three-Beat Ritual", "Ritual Sequence", "Coffee. Cookie. Repeat.", "P2"],
  ["C015", "Premium Explained", "Ingredient Editorial", "Premium should explain itself.", "P1"],
  ["C005", "Front Makes It / Back Earns It", "Front vs Back", "The front makes the promise. The back earns it.", "P1"],
  ["C010", "Normal Life, Better Food", "Editorial Lifestyle", "Health first. Personality intact.", "P2"]
];
