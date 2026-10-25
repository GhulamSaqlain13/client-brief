import type { SpeakerRole } from "./model";

export type ParsedLine = {
  line: string;
  body: string;
  speaker?: string;
  sentAt?: string;
};
// Words that look like "Label:" prefixes in briefs rather than people.
const labels = new Set(
  "budget deadline timeline note notes scope deliverables deliverable requirements requirement price cost date time subject re fwd todo url link email phone total goal goals objective summary update ps p.s question answer step phase milestone payment".split(
    " ",
  ),
);
const selfNames = /^(me|you|i|myself|freelancer)$/i;
function plausibleName(name: string) {
  const n = name.trim();
  return (
    /^[\p{L}][\p{L}\p{N} ._'-]{0,39}$/u.test(n) &&
    n.split(/\s+/).length <= 4 &&
    !labels.has(n.toLowerCase())
  );
}
function stamped(line: string): ParsedLine | undefined {
  const patterns = [
    // [2026-10-20 14:05] Name: message
    /^\[(?<ts>[^\]]*\d[^\]]{2,38})\]\s*(?<name>[^:]{1,40}):\s*(?<body>.+)$/u,
    // 10/20/26, 2:05 PM - Name: message
    /^(?<ts>\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:[AaPp][Mm])?)\s*[-–]\s*(?<name>[^:]{1,40}):\s*(?<body>.+)$/u,
    // Name (Oct 20, 2:05 PM): message
    /^(?<name>[^:[\]()]{1,40}?)\s*[([](?<ts>[^)\]]*\d[^)\]]{2,38})[)\]]\s*:\s*(?<body>.+)$/u,
  ];
  for (const pattern of patterns) {
    const m = line.match(pattern);
    if (m?.groups && plausibleName(m.groups.name))
      return {
        line,
        body: m.groups.body.trim(),
        speaker: m.groups.name.trim(),
        sentAt: m.groups.ts.trim(),
      };
  }
}
function plain(line: string) {
  const m = line.match(/^(?<name>[^:]{1,40}):\s*(?<body>.+)$/u);
  return m?.groups && plausibleName(m.groups.name)
    ? { name: m.groups.name.trim(), body: m.groups.body.trim() }
    : undefined;
}
// A bare "Name: message" counts only when the name repeats or is clearly the user,
// so lines such as "Budget: $500" are not mistaken for speakers.
export function knownSpeakers(text: string): string[] {
  const counts = new Map<string, number>();
  const names = new Set<string>();
  for (const line of text.split(/\n+/).map((l) => l.trim())) {
    const s = stamped(line);
    if (s?.speaker) names.add(s.speaker);
    else {
      const p = plain(line);
      if (p) counts.set(p.name, (counts.get(p.name) || 0) + 1);
    }
  }
  for (const [name, count] of counts)
    if (count >= 2 || selfNames.test(name)) names.add(name);
  return [...names];
}
export function parseLine(line: string, speakers: string[]): ParsedLine {
  const s = stamped(line);
  if (s) return s;
  const p = plain(line);
  if (p && speakers.includes(p.name))
    return { line, body: p.body, speaker: p.name };
  return { line, body: line };
}
export function defaultRole(name: string): SpeakerRole {
  return selfNames.test(name) ? "me" : "client";
}
export function timestamp(value?: string) {
  if (!value) return NaN;
  const time = Date.parse(value.replace(/,(?=\s*\d{1,2}:)/, ""));
  return Number.isFinite(time) ? time : NaN;
}
// Reorders messages by their written timestamps. Lines without a timestamp stay
// attached to the message above them. Returns undefined when it cannot help.
export function sortByTime(text: string): string | undefined {
  const speakers = knownSpeakers(text);
  const blocks: { time: number; lines: string[] }[] = [];
  for (const line of text.split("\n")) {
    const time = timestamp(parseLine(line.trim(), speakers).sentAt);
    if (!blocks.length || Number.isFinite(time))
      blocks.push({ time, lines: [line] });
    else blocks.at(-1)!.lines.push(line);
  }
  if (blocks.filter((b) => Number.isFinite(b.time)).length < 2) return;
  const sorted = blocks
    .map((b, i) => ({ ...b, i }))
    .sort((a, b) =>
      !Number.isFinite(a.time)
        ? -1
        : !Number.isFinite(b.time)
          ? 1
          : a.time - b.time || a.i - b.i,
    );
  return sorted.flatMap((b) => b.lines).join("\n");
}
export const captureLimit = 100000;
// Longer pasted threads are saved as several linked captures.
export const threadLimit = 1000000;
// Splits long threads at line boundaries into parts that fit one capture.
export function splitThread(text: string, max = captureLimit): string[] {
  const parts: string[] = [];
  let current = "";
  for (const line of text.split("\n")) {
    let rest = line;
    while (rest.length > max) {
      if (current.trim()) parts.push(current);
      current = "";
      parts.push(rest.slice(0, max));
      rest = rest.slice(max);
    }
    const next = current ? `${current}\n${rest}` : rest;
    if (next.length > max) {
      if (current.trim()) parts.push(current);
      current = rest;
    } else current = next;
  }
  if (current.trim()) parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}
