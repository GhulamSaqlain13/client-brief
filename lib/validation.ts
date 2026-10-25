import {
  checkChangeOrder,
  checkEvidence,
  sections,
  validDay,
  type Capture,
  type ChangeOrder,
  type ChecklistItem,
  type ClientRecord,
  type Confirmation,
  type Payment,
  type Settings,
  type Evidence,
  type Revision,
  type RevisionPolicy,
  type Item,
  type Milestone,
  type Project,
  type Proposal,
  type Store,
  type Version,
} from "./model";
import { templateIds } from "./templates";

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
    questionUpdatedAt: optional(v.questionUpdatedAt, date),
    speaker: optional(v.speaker, (x) => nonempty(x, 40)),
    sentAt: optional(v.sentAt, (x) => nonempty(x, 40)),
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
    speakers: optional(v.speakers, (x) => {
      const entries = Object.entries(object(x));
      if (entries.length > 50) throw new Error("Too many speakers.");
      return Object.fromEntries(
        entries.map(([name, role]) => [
          nonempty(name, 40),
          enumeration(role, ["client", "me", "other"] as const),
        ]),
      );
    }),
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
function changeOrder(value: unknown): ChangeOrder {
  const v = object(value);
  const result: ChangeOrder = {
    amount: optional(v.amount, (x) => {
      if (typeof x !== "number") throw new Error("Invalid amount.");
      return x;
    }),
    currency: text(v.currency, 3),
    extraDays: optional(v.extraDays, integer),
    message: text(v.message, 5000),
    status: enumeration(v.status, [
      "draft",
      "sent",
      "accepted by client",
      "declined by client",
    ]),
    updatedAt: date(v.updatedAt),
  };
  checkChangeOrder(result);
  return result;
}
function evidence(v: RecordValue): Evidence {
  return {
    sourceId: optional(v.sourceId, nonempty),
    excerpt: optional(v.excerpt, text),
    manual: optional(v.manual, bool),
  };
}
function revisionPolicy(value: unknown): RevisionPolicy {
  const v = object(value);
  const limit = integer(v.limit);
  if (limit > 100) throw new Error("Invalid revision limit.");
  return { ...evidence(v), limit };
}
function revision(value: unknown): Revision {
  const v = object(value);
  const requestedAt = text(v.requestedAt, 10);
  if (!validDay(requestedAt)) throw new Error("Invalid revision date.");
  return {
    ...evidence(v),
    id: nonempty(v.id),
    requestedAt,
    deliverable: text(v.deliverable, 200),
    note: nonempty(v.note, 2000),
    status: enumeration(v.status, ["requested", "in progress", "delivered"]),
    counts: bool(v.counts),
    changeOrder: optional(v.changeOrder, changeOrder),
  };
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
    changeOrder: optional(v.changeOrder, changeOrder),
    hint: optional(v.hint, (x) => text(x, 2000)),
  };
}
function checklistItem(value: unknown): ChecklistItem {
  const v = object(value);
  return {
    id: nonempty(v.id),
    label: nonempty(v.label, 200),
    status: enumeration(v.status, ["missing", "received", "not needed"]),
    note: optional(v.note, (x) => text(x, 1000)),
  };
}
function day(value: unknown): string {
  const result = text(value, 10);
  if (!validDay(result)) throw new Error("Invalid date.");
  return result;
}
function payment(value: unknown): Payment {
  const v = object(value);
  return {
    ...evidence(v),
    id: nonempty(v.id),
    title: nonempty(v.title, 200),
    amount: optional(v.amount, (x) => {
      if (typeof x !== "number") throw new Error("Invalid amount.");
      return x;
    }),
    currency: text(v.currency, 3),
    due: v.due === "" ? "" : day(v.due),
    status: enumeration(v.status, ["due", "paid"]),
    paidAt: optional(v.paidAt, (x) => (x === "" ? "" : day(x))),
  };
}
function confirmation(value: unknown): Confirmation {
  const v = object(value);
  const version = integer(v.version);
  if (!version) throw new Error("Invalid confirmation version.");
  return {
    id: nonempty(v.id),
    version,
    sourceId: nonempty(v.sourceId),
    excerpt: nonempty(v.excerpt, 100000),
    recordedAt: date(v.recordedAt),
  };
}
function client(value: unknown): ClientRecord {
  const v = object(value);
  return {
    id: nonempty(v.id),
    name: nonempty(v.name, 100),
    platform: optional(v.platform, (x) => text(x, 100)),
    notes: optional(v.notes, (x) => text(x, 5000)),
    createdAt: date(v.createdAt),
  };
}
function settings(value: unknown): Settings {
  const v = object(value);
  const age = optional(v.questionAgeDays, integer);
  if (age !== undefined && (age < 1 || age > 90))
    throw new Error("Invalid question reminder age.");
  return {
    defaultTemplate: optional(v.defaultTemplate, (x) =>
      enumeration(x, templateIds),
    ),
    questionAgeDays: age,
    reminders: optional(v.reminders, bool),
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
    revisionPolicy: optional(v.revisionPolicy, revisionPolicy),
    revisions: optional(v.revisions, (x) => list(x, revision)),
    template: optional(v.template, (x) => enumeration(x, templateIds)),
    checklist: optional(v.checklist, (x) => list(x, checklistItem, 500)),
    payments: optional(v.payments, (x) => list(x, payment, 500)),
    confirmations: optional(v.confirmations, (x) => list(x, confirmation, 500)),
  };
  unique(p.items);
  unique(p.revisions || []);
  unique(p.checklist || []);
  unique(p.payments || []);
  unique(p.confirmations || []);
  for (const e of [
    ...(p.revisionPolicy ? [p.revisionPolicy] : []),
    ...(p.revisions || []),
    ...(p.payments || []),
    ...(p.confirmations || []),
  ])
    checkEvidence(p, e);
  if (
    p.confirmations?.some(
      (c) => !p.versions.some((v) => v.number === c.version),
    )
  )
    throw new Error("A client confirmation refers to a missing version.");
  for (const pay of p.payments || [])
    if (pay.amount !== undefined) {
      if (
        !Number.isFinite(pay.amount) ||
        pay.amount < 0 ||
        !/^[A-Z]{3}$/.test(pay.currency)
      )
        throw new Error("Invalid payment amount.");
    }
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
    const clients = optional(v.clients, (x) => list(x, client, 1000));
    unique(clients || []);
    if (
      new Set((clients || []).map((c) => c.name.toLowerCase())).size !==
      (clients || []).length
    )
      throw new Error("Duplicate client names.");
    return {
      projects,
      drafts,
      revision: optional(v.revision, integer),
      clients,
      settings: optional(v.settings, settings),
    };
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
