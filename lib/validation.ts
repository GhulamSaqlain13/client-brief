import {
  sections,
  type Capture,
  type Item,
  type Milestone,
  type Project,
  type Proposal,
  type Store,
  type Version,
} from "./model";

type RecordValue = Record<string, unknown>;
function object(value: unknown): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected an object.");
  return value as RecordValue;
}
function text(value: unknown, max = 100000): string {
  if (typeof value !== "string" || value.length > max)
    throw new Error("Invalid or oversized text field.");
  return value;
}
function nonempty(value: unknown, max = 200): string {
  const result = text(value, max);
  if (!result.trim()) throw new Error("A required field is empty.");
  return result;
}
function enumeration<T extends string>(
  value: unknown,
  choices: readonly T[],
): T {
  if (!choices.includes(value as T))
    throw new Error("Invalid status or category.");
  return value as T;
}
function list<T>(
  value: unknown,
  parse: (value: unknown) => T,
  max = 5000,
): T[] {
  if (!Array.isArray(value) || value.length > max)
    throw new Error("Invalid or oversized list.");
  return value.map(parse);
}
function integer(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0)
    throw new Error("Invalid revision/version number.");
  return value as number;
}
function date(value: unknown): string {
  const result = text(value, 100);
  if (!Number.isFinite(Date.parse(result)))
    throw new Error("Invalid timestamp.");
  return result;
}
function optional<T>(value: unknown, parse: (v: unknown) => T): T | undefined {
  return value === undefined ? undefined : parse(value);
}
function bool(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("Invalid boolean.");
  return value;
}
function unique(values: { id: string }[]): void {
  if (new Set(values.map((v) => v.id)).size !== values.length)
    throw new Error("Duplicate IDs in saved data.");
}
function item(value: unknown): Item {
  const v = object(value);
  return {
    id: nonempty(v.id),
    section: enumeration(v.section, sections),
    text: nonempty(v.text, 100000),
    state: enumeration(v.state, [
      "proposed",
      "confirmed",
      "ambiguous",
      "contradicted",
      "not mentioned",
    ]),
    sourceId: optional(v.sourceId, nonempty),
    excerpt: optional(v.excerpt, text),
    manual: optional(v.manual, bool),
    priority: optional(v.priority, (x) =>
      enumeration(x, ["must", "should", "could"]),
    ),
    owner: optional(v.owner, (x) => text(x, 100)),
    questionStatus: optional(v.questionStatus, (x) =>
      enumeration(x, [
        "open",
        "asked",
        "answered",
        "blocked",
        "no longer needed",
      ]),
    ),
  };
}
function capture(value: unknown): Capture {
  const v = object(value);
  const url = text(v.url, 2048);
  if (url && !/^https?:\/\//i.test(url)) throw new Error("Invalid source URL.");
  const hash = text(v.hash, 64);
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error("Invalid source hash.");
  return {
    id: nonempty(v.id),
    text: nonempty(v.text, 100000),
    url,
    capturedAt: date(v.capturedAt),
    hash,
  };
}
function version(value: unknown): Version {
  const v = object(value);
  const items = list(v.items, item);
  unique(items);
  const number = integer(v.number);
  if (!number) throw new Error("Version numbers start at one.");
  return { number, approvedAt: date(v.approvedAt), items };
}
function proposal(value: unknown): Proposal {
  const v = object(value);
  return {
    id: nonempty(v.id),
    item: item(v.item),
    before: text(v.before, 1000000),
    status: enumeration(v.status, ["pending", "accepted", "rejected"]),
    operation: optional(v.operation, (x) =>
      enumeration(x, ["upsert", "remove"]),
    ),
    category: optional(v.category, (x) => text(x, 100)),
    reason: optional(v.reason, (x) => text(x, 2000)),
    reviewedAt: optional(v.reviewedAt, date),
  };
}
function milestone(value: unknown): Milestone {
  const v = object(value);
  const due = text(v.due, 10);
  if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due))
    throw new Error("Invalid milestone date.");
  if (due) {
    const parsed = new Date(`${due}T00:00:00Z`);
    if (
      !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== due
    )
      throw new Error("Invalid milestone date.");
  }
  return {
    id: nonempty(v.id),
    title: nonempty(v.title, 200),
    due,
    status: enumeration(v.status, ["planned", "in progress", "completed"]),
    acceptance: text(v.acceptance, 2000),
    dependency: optional(v.dependency, (x) => text(x, 200)),
  };
}
function project(value: unknown): Project {
  const v = object(value);
  const p: Project = {
    id: nonempty(v.id),
    title: nonempty(v.title, 120),
    client: nonempty(v.client, 100),
    platform: nonempty(v.platform, 100),
    archived: bool(v.archived),
    createdAt: date(v.createdAt),
    items: list(v.items, item),
    sources: list(v.sources, capture),
    versions: list(v.versions, version),
    proposals: list(v.proposals, proposal),
    status: optional(v.status, (x) =>
      enumeration(x, [
        "new",
        "clarifications needed",
        "in progress",
        "completed",
      ]),
    ),
    notes: optional(v.notes, (x) => text(x, 10000)),
    tags: optional(v.tags, (x) => text(x, 500)),
    milestones: optional(v.milestones, (x) => list(x, milestone)),
    versionSequence: optional(v.versionSequence, integer),
  };
  unique(p.items);
  unique(p.sources);
  unique(p.proposals);
  unique(p.milestones || []);
  if (new Set(p.versions.map((x) => x.number)).size !== p.versions.length)
    throw new Error("Duplicate version numbers.");
  if (p.versions.some((v, i) => i > 0 && v.number <= p.versions[i - 1].number))
    throw new Error("Version history is out of order.");
  const evidence = [
    ...p.items,
    ...p.versions.flatMap((v) => v.items),
    ...p.proposals.map((p) => p.item),
  ];
  for (const i of evidence) {
    if (
      !i.manual &&
      !p.sources.some(
        (s) => s.id === i.sourceId && s.text.includes(i.excerpt || i.text),
      )
    )
      throw new Error("A requirement has missing or invalid source evidence.");
    if (i.sourceId && !p.sources.some((s) => s.id === i.sourceId))
      throw new Error("A source reference is invalid.");
  }
  const milestoneIds = new Set((p.milestones || []).map((m) => m.id));
  if (
    p.milestones?.some(
      (m) =>
        m.dependency &&
        (!milestoneIds.has(m.dependency) || m.dependency === m.id),
    )
  )
    throw new Error("Invalid milestone dependency.");
  for (const milestone of p.milestones || []) {
    const visited = new Set<string>();
    let current: Milestone | undefined = milestone;
    while (current) {
      if (visited.has(current.id))
        throw new Error("Milestone prerequisites cannot form a cycle.");
      visited.add(current.id);
      const dependency: string | undefined = current.dependency;
      current = dependency
        ? p.milestones?.find((m) => m.id === dependency)
        : undefined;
    }
  }
  return p;
}
export function validateStore(value: unknown): Store {
  try {
    const v = object(value);
    const projects = list(v.projects, project, 1000);
    unique(projects);
    const drafts = Object.fromEntries(
      Object.entries(object(v.drafts)).map(([key, value]) => [
        nonempty(key),
        text(value),
      ]),
    );
    if (Object.keys(drafts).some((key) => !projects.some((p) => p.id === key)))
      throw new Error("A draft refers to an unknown project.");
    return { projects, drafts, revision: optional(v.revision, integer) };
  } catch (error) {
    throw new Error(
      `Workspace data is invalid: ${error instanceof Error ? error.message : "unknown format"}`,
      { cause: error },
    );
  }
}
export function parseBackup(text: string): Store {
  if (text.length > 10 * 1024 * 1024)
    throw new Error("Backup must be smaller than 10 MB.");
  try {
    return validateStore(JSON.parse(text));
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new Error("This file is not valid JSON.", { cause: error });
    throw error;
  }
}
