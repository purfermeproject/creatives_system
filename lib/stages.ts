export const STAGES = [
  { key: "research", title: "Research Engine", number: 1 },
  { key: "angles", title: "Angle Engine", number: 2 },
  { key: "hooks", title: "Hook Engine", number: 3 },
  { key: "concepts", title: "Concept Engine", number: 4 },
  { key: "briefs", title: "Creative Brief Engine", number: 5 },
  { key: "production", title: "Image Production", number: 6 },
  { key: "qa", title: "QA Engine", number: 7 },
  { key: "testing", title: "Test Matrix", number: 8 },
  { key: "performance", title: "Performance Ingestion", number: 9 },
  { key: "learning", title: "Learning Engine", number: 10 },
  { key: "expansion", title: "Winner Expansion", number: 11 },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];

export function previousStage(stage: StageKey) {
  const i = STAGES.findIndex(s => s.key === stage);
  return i <= 0 ? null : STAGES[i - 1].key;
}

export function isAIStage(stage: string): stage is StageKey {
  return STAGES.some(s => s.key === stage) && !["performance"].includes(stage);
}
