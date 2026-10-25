import type { Item } from "./model";

// Deterministic comparison rules, not semantic AI. They only pre-select a
// classification and explain why; the user still decides.
const stop = new Set(
  "this that with from have will would could should please also include included including into your their there about which what when where make need want more some just like page pages work able they them then than been were does done each other only over very".split(
    " ",
  ),
);
const words = (text: string) =>
  new Set(
    text
      .toLowerCase()
      .match(/\p{L}{4,}/gu)
      ?.map((w) => w.replace(/s$/, ""))
      .filter((w) => !stop.has(w)) || [],
  );
const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
export function amounts(text: string): string[] {
  return (
    text.match(
      /[$€£]\s?\d[\d,]*(?:\.\d+)?|\d[\d,]*(?:\.\d+)?\s?(?:usd|eur|gbp|pkr|inr|dollars?)\b/gi,
    ) || []
  ).map((a) => a.replace(/[\s,]/g, "").toLowerCase());
}
const day =
  /\b(?:mon|tues?|wed(?:nes)?|thu(?:rs)?|fri|sat(?:ur)?|sun)(?:day)?\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{1,2}\b|\b\d{1,2}[/.-]\d{1,2}(?:[/.-]\d{2,4})?\b|\b\d{4}-\d{2}-\d{2}\b|\b\d+\s+(?:business\s+|working\s+)?(?:days?|weeks?|months?)\b/gi;
export function dates(text: string): string[] {
  return (text.match(day) || []).map((d) =>
    d.toLowerCase().replace(/\s+/g, " "),
  );
}
export function suggest(
  item: Item,
  baseline: Item[],
): { category: string; hint?: string } {
  const same = baseline.find((b) => normalize(b.text) === normalize(item.text));
  if (same)
    return {
      category: "duplicate",
      hint: `Same wording as an approved item: "${same.text}"`,
    };
  const budget = baseline.filter((b) => b.section === "budget");
  const incomingAmounts = amounts(item.text);
  const approvedAmounts = budget.flatMap((b) => amounts(b.text));
  if (
    incomingAmounts.length &&
    approvedAmounts.length &&
    !incomingAmounts.some((a) => approvedAmounts.includes(a))
  )
    return {
      category: "budget change",
      hint: `Mentions ${incomingAmounts.join(", ")}; the approved budget mentions ${approvedAmounts.join(", ")}.`,
    };
  const timeline = baseline.filter((b) => b.section === "timeline");
  const incomingDates = dates(item.text);
  const approvedDates = timeline.flatMap((b) => dates(b.text));
  if (
    incomingDates.length &&
    approvedDates.length &&
    !incomingDates.some((d) => approvedDates.includes(d))
  )
    return {
      category: "deadline change",
      hint: `Mentions ${incomingDates.join(", ")}; the approved timeline mentions ${approvedDates.join(", ")}.`,
    };
  if (item.section !== "exclusions") {
    const incoming = words(item.text);
    const excluded = baseline
      .filter((b) => b.section === "exclusions")
      .find((b) => [...words(b.text)].some((w) => incoming.has(w)));
    if (excluded)
      return {
        category: "scope expansion",
        hint: `Overlaps an item agreed as not included: "${excluded.text}"`,
      };
  }
  if (item.section === "requirements" || item.section === "deliverables")
    return {
      category: "new feature",
      hint: "Not found in the approved scope.",
    };
  return { category: "clarification" };
}
