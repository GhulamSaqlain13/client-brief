import { suggest } from "./compare";
import { knownSpeakers, parseLine } from "./conversation";
export const sections = [
  "overview",
  "requirements",
  "deliverables",
  "timeline",
  "budget",
  "questions",
  "exclusions",
] as const;
export type Section = (typeof sections)[number];
export type Item = {
  id: string;
  section: Section;
  text: string;
  sourceId?: string;
  excerpt?: string;
  state:
    "proposed" | "confirmed" | "ambiguous" | "contradicted" | "not mentioned";
  manual?: boolean;
  priority?: "must" | "should" | "could";
  owner?: string;
  questionStatus?:
    "open" | "asked" | "answered" | "blocked" | "no longer needed";
  questionUpdatedAt?: string;
  // Parsed from "Name: message" lines; sentAt is kept exactly as written.
  speaker?: string;
  sentAt?: string;
};
export type SpeakerRole = "client" | "me" | "other";
export type Capture = {
  id: string;
  text: string;
  url: string;
  capturedAt: string;
  hash: string;
  speakers?: Record<string, SpeakerRole>;
};
export type Version = { number: number; approvedAt: string; items: Item[] };
// Price and time impact are typed by the user; the app never estimates them.
export type ChangeOrder = {
  amount?: number;
  currency: string;
  extraDays?: number;
  message: string;
  status: "draft" | "sent" | "accepted by client" | "declined by client";
  updatedAt: string;
};
export type Evidence = {
  sourceId?: string;
  excerpt?: string;
  manual?: boolean;
};
export type RevisionPolicy = Evidence & { limit: number };
export type Revision = Evidence & {
  id: string;
  requestedAt: string;
  deliverable: string;
  note: string;
  status: "requested" | "in progress" | "delivered";
  counts: boolean;
  changeOrder?: ChangeOrder;
};
export type Proposal = {
  id: string;
  item: Item;
  before: string;
  status: "pending" | "accepted" | "rejected";
  operation?: "upsert" | "remove";
  category?: string;
  reviewedAt?: string;
  reason?: string;
  changeOrder?: ChangeOrder;
  // Rule-based comparison note shown to the reviewer; never applied automatically.
  hint?: string;
};
export type ChecklistItem = {
  id: string;
  label: string;
  status: "missing" | "received" | "not needed";
  note?: string;
};
export type Payment = Evidence & {
  id: string;
  title: string;
  amount?: number;
  currency: string;
  due: string;
  status: "due" | "paid";
  paidAt?: string;
};
export type Confirmation = {
  id: string;
  version: number;
  sourceId: string;
  excerpt: string;
  recordedAt: string;
};
export type ClientRecord = {
  id: string;
  name: string;
  platform?: string;
  notes?: string;
  createdAt: string;
};
export type Settings = {
  defaultTemplate?: string;
  questionAgeDays?: number;
  reminders?: boolean;
};
export type Milestone = {
  id: string;
  title: string;
  due: string;
  status: "planned" | "in progress" | "completed";
  acceptance: string;
  dependency?: string;
};
export type Project = {
  id: string;
  title: string;
  client: string;
  platform: string;
  archived: boolean;
  sources: Capture[];
  items: Item[];
  versions: Version[];
  proposals: Proposal[];
  createdAt: string;
  status?: "new" | "clarifications needed" | "in progress" | "completed";
  notes?: string;
  tags?: string;
  milestones?: Milestone[];
  versionSequence?: number;
  revisionPolicy?: RevisionPolicy;
  revisions?: Revision[];
  template?: string;
  checklist?: ChecklistItem[];
  payments?: Payment[];
  confirmations?: Confirmation[];
};
export type Store = {
  projects: Project[];
  drafts: Record<string, string>;
  revision?: number;
  clients?: ClientRecord[];
  settings?: Settings;
};
export const emptyStore: Store = { projects: [], drafts: {} };
export const id = () => crypto.randomUUID();
export function createProject(
  title: string,
  client: string,
  platform: string,
): Project {
  if (
    !title.trim() ||
    !client.trim() ||
    title.length > 120 ||
    client.length > 100
  )
    throw new Error(
      "Enter a project name (up to 120 characters) and client name (up to 100 characters).",
    );
  return {
    id: id(),
    title,
    client,
    platform,
    archived: false,
    sources: [],
    items: [],
    versions: [],
    proposals: [],
    createdAt: new Date().toISOString(),
  };
}
export async function contentHash(text: string) {
  const normalized = text.trim().replace(/\s+/g, " ");
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(normalized),
  );
  return Array.from(new Uint8Array(bytes), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
// Conservative offline organizer, explicitly not an AI/semantic extraction engine.
export function organize(source: Capture): Item[] {
  const speakers = knownSpeakers(source.text);
  return source.text
    .split(/\n+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((line) => parseLine(line, speakers))
    .map(({ line, body: text, speaker, sentAt }) => {
      let section: Section = "requirements";
      if (/\?\s*$/.test(text)) section = "questions";
      else if (
        /\b(not included|out of scope|excluded|excluding|not part of|(will not|won't|does not|doesn't) (include|cover))\b/i.test(
          text,
        )
      )
        section = "exclusions";
      else if (/\b(budget|price|payment|cost|usd|eur|pkr)\b|[$€£]/i.test(text))
        section = "budget";
      else if (
        /\b(deadline|due|timeline|by (monday|tuesday|wednesday|thursday|friday)|weeks?|months?)\b/i.test(
          text,
        )
      )
        section = "timeline";
      else if (/\b(deliver|deliverables|handover|files)\b/i.test(text))
        section = "deliverables";
      else if (/\b(goal|objective|audience|business)\b/i.test(text))
        section = "overview";
      return {
        id: id(),
        section,
        text,
        sourceId: source.id,
        excerpt: line,
        state: "proposed" as const,
        ...(speaker ? { speaker } : {}),
        ...(sentAt ? { sentAt } : {}),
      };
    });
}
export function addCapture(project: Project, source: Capture): Project {
  if (!source.text.trim() || source.text.length > 100000)
    throw new Error(
      "Enter between 1 and 100,000 characters. Split larger conversations into captures.",
    );
  if (source.url && !/^https?:\/\//i.test(source.url))
    throw new Error("Source URL must begin with https:// or http://.");
  if (project.sources.some((s) => s.hash === source.hash))
    throw new Error(
      "This conversation has already been captured in this project.",
    );
  const existing = new Set([
    ...project.items.map((i) => i.text),
    ...project.proposals
      .filter((p) => p.status !== "rejected")
      .map((p) => p.item.text),
  ]);
  const incoming = organize(source).filter((item) => !existing.has(item.text));
  const baseline = project.versions.at(-1);
  return {
    ...project,
    sources: [...project.sources, source],
    items: baseline ? project.items : [...project.items, ...incoming],
    proposals: baseline
      ? [
          ...project.proposals,
          ...incoming.map((item) => ({
            id: id(),
            item,
            before:
              baseline.items
                .filter((i) => i.section === item.section)
                .map((i) => i.text)
                .join("\n") || "unknown",
            status: "pending" as const,
            ...suggest(item, baseline.items),
          })),
        ]
      : project.proposals,
  };
}
export function approve(project: Project): Project {
  if (!project.items.length && !project.versions.length)
    throw new Error("Add requirements before approving a baseline.");
  if (project.proposals.some((p) => p.status === "pending"))
    throw new Error("Review pending changes before approving a new baseline.");
  if (
    project.items.some(
      (i) =>
        !i.manual &&
        (!i.sourceId ||
          !project.sources.some(
            (s) => s.id === i.sourceId && s.text.includes(i.excerpt || i.text),
          )),
    )
  )
    throw new Error("Each extracted item needs valid source evidence.");
  if (
    project.items.some(
      (i) =>
        i.state === "contradicted" ||
        i.state === "ambiguous" ||
        i.state === "not mentioned",
    )
  )
    throw new Error(
      "Resolve ambiguous, contradicted, or unmentioned items before approval.",
    );
  const items = project.items.map((i) => ({
    ...i,
    state: i.state === "proposed" ? ("confirmed" as const) : i.state,
  }));
  const number =
    Math.max(
      project.versionSequence || 0,
      ...project.versions.map((v) => v.number),
      0,
    ) + 1;
  return {
    ...project,
    items,
    versionSequence: number,
    versions: [
      ...project.versions,
      {
        number,
        approvedAt: new Date().toISOString(),
        items: structuredClone(items),
      },
    ],
  };
}
export function markdown(project: Project) {
  const version = project.versions.at(-1);
  if (!version) throw new Error("Approve a baseline before exporting.");
  return (
    `# ${project.title}\n\nClient: ${project.client}\nVersion: ${version.number}\nApproved: ${version.approvedAt}\nExported: ${new Date().toISOString()}\n` +
    sections
      .map(
        (section) =>
          `\n## ${section}\n` +
          (version.items
            .filter((i) => i.section === section)
            .map(
              (i) =>
                `- ${i.text} [${i.state}; ${i.manual ? "manually entered" : `source ${i.sourceId}`} ]`,
            )
            .join("\n") || "unknown"),
      )
      .join("\n") +
    `\n\n## Revision tracking (live, not part of the approved version)\n${revisionSummary(project)}` +
    `\n\n## Payment schedule (live)\n${
      (project.payments || [])
        .map(
          (p) =>
            `- ${p.title}: ${p.amount === undefined ? "amount unknown" : formatAmount(p.amount, p.currency)}; ${p.status === "paid" ? `paid ${p.paidAt || ""}` : `due ${p.due || "unknown"}`} [${p.manual ? "manually entered" : `source ${p.sourceId}`}]`,
        )
        .join("\n") || "unknown"
    }` +
    "\n\n## Evidence appendix\n" +
    project.sources
      .filter((s) => version.items.some((i) => i.sourceId === s.id))
      .map(
        (s) =>
          `\n### Source ${s.id}\nCaptured: ${s.capturedAt}\nURL: ${s.url || "pasted text"}\n\n${version.items
            .filter((i) => i.sourceId === s.id)
            .map((i) => `> ${i.excerpt || i.text}`)
            .join("\n\n")}`,
      )
      .join("\n")
  );
}

export const labels: Record<Section, string> = {
  overview: "Project overview",
  requirements: "Requirements",
  deliverables: "Deliverables",
  timeline: "Timeline",
  budget: "Budget & payment",
  questions: "Open questions",
  exclusions: "Not included (out of scope)",
};
export const platforms = [
  "Independent",
  "Fiverr",
  "Upwork",
  "Freelancer.com",
  "Other",
];
export function editItem(
  project: Project,
  item: Item,
  remove = false,
): Project {
  if (!item.text.trim()) throw new Error("An item cannot be empty.");
  const previous = project.items.find((i) => i.id === item.id);
  if (project.versions.length) {
    if (
      project.proposals.some(
        (p) => p.status === "pending" && p.item.id === item.id,
      )
    )
      throw new Error(
        "Review the pending proposal for this item before proposing another edit.",
      );
    return {
      ...project,
      proposals: [
        ...project.proposals,
        {
          id: id(),
          item,
          before: previous?.text || "unknown",
          operation: remove ? "remove" : "upsert",
          status: "pending",
          category: remove
            ? "scope reduction"
            : previous
              ? "clarification"
              : "new feature",
        },
      ],
    };
  }
  return {
    ...project,
    items: remove
      ? project.items.filter((i) => i.id !== item.id)
      : previous
        ? project.items.map((i) => (i.id === item.id ? item : i))
        : [...project.items, item],
  };
}
export function reviewProposal(
  project: Project,
  proposalId: string,
  action: "accept" | "reject" | "replace",
  category: string,
  reason: string,
): Project {
  const proposal = project.proposals.find((p) => p.id === proposalId);
  if (!proposal || proposal.status !== "pending")
    throw new Error("This proposal has already been reviewed.");
  let items = project.items;
  if (action !== "reject") {
    if (proposal.operation === "remove")
      items = items.filter((i) => i.id !== proposal.item.id);
    else if (action === "replace")
      items = [
        ...items.filter((i) => i.section !== proposal.item.section),
        proposal.item,
      ];
    else
      items = items.some((i) => i.id === proposal.item.id)
        ? items.map((i) => (i.id === proposal.item.id ? proposal.item : i))
        : [...items, proposal.item];
  }
  return {
    ...project,
    items,
    proposals: project.proposals.map((p) =>
      p.id === proposalId
        ? {
            ...p,
            category,
            reason,
            status: action === "reject" ? "rejected" : "accepted",
            reviewedAt: new Date().toISOString(),
          }
        : p,
    ),
  };
}
export function removeCapture(project: Project, sourceId: string): Project {
  const affected = (item: Item) => item.sourceId === sourceId;
  // Proposal.before may quote deleted evidence, so remove section-related proposals too.
  const affectedSections = new Set(
    [...project.items, ...project.versions.flatMap((v) => v.items)]
      .filter(affected)
      .map((i) => i.section),
  );
  const versions = project.versions.filter((v) => !v.items.some(affected));
  return {
    ...project,
    sources: project.sources.filter((s) => s.id !== sourceId),
    items: project.items.filter((i) => !affected(i)),
    proposals: project.proposals.filter(
      (p) => !affected(p.item) && !affectedSections.has(p.item.section),
    ),
    versions,
    payments: project.payments?.filter((p) => p.sourceId !== sourceId),
    confirmations: project.confirmations?.filter(
      (c) =>
        c.sourceId !== sourceId && versions.some((v) => v.number === c.version),
    ),
    revisions: project.revisions?.filter((r) => r.sourceId !== sourceId),
    revisionPolicy:
      project.revisionPolicy?.sourceId === sourceId
        ? undefined
        : project.revisionPolicy,
    versionSequence: Math.max(
      project.versionSequence || 0,
      ...project.versions.map((v) => v.number),
      0,
    ),
  };
}
export function redact(text: string): string {
  return text
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email removed]")
    .replace(/\b(?:sk-[a-z0-9_-]{12,}|AKIA[A-Z0-9]{16})\b/gi, "[key removed]")
    .replace(
      /\b(password|api[_ -]?key|token|secret)\s*[:=]\s*[^\s,;]+/gi,
      "$1: [removed]",
    )
    .replace(/(?:\+\d[\d ()-]{8,}\d)/g, "[phone removed]");
}
export function csv(project: Project): string {
  const version = project.versions.at(-1);
  if (!version) throw new Error("Approve a baseline before exporting.");
  const cell = (value: string) =>
    '"' +
    (/^[=+@\-\t\r]/.test(value) ? "'" : "") +
    value.replace(/"/g, '""') +
    '"';
  return [
    [
      "Version",
      "Exported at",
      "ID",
      "Section",
      "Text",
      "Priority",
      "State",
      "Source",
    ],
    ...version.items.map((i) => [
      String(version.number),
      new Date().toISOString(),
      i.id,
      i.section,
      i.text,
      i.priority || "should",
      i.state,
      i.manual ? "manually entered" : i.sourceId || "",
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
}
export function checkEvidence(project: Project, evidence: Evidence) {
  if (evidence.manual) return;
  if (
    !evidence.sourceId ||
    !evidence.excerpt?.trim() ||
    !project.sources.some(
      (s) => s.id === evidence.sourceId && s.text.includes(evidence.excerpt!),
    )
  )
    throw new Error(
      "Paste the exact words from the selected conversation, or mark this as entered manually.",
    );
}
export function validDay(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
export function checkChangeOrder(order: ChangeOrder) {
  if (
    order.amount !== undefined &&
    (!Number.isFinite(order.amount) ||
      order.amount < 0 ||
      order.amount > 1e9 ||
      Math.abs(Math.round(order.amount * 100) - order.amount * 100) > 1e-6)
  )
    throw new Error(
      "Enter the price as a positive amount with up to 2 decimals.",
    );
  if (order.amount !== undefined && !/^[A-Z]{3}$/.test(order.currency))
    throw new Error("Enter a 3-letter currency code, such as USD.");
  if (
    order.extraDays !== undefined &&
    (!Number.isSafeInteger(order.extraDays) ||
      order.extraDays < 0 ||
      order.extraDays > 3650)
  )
    throw new Error("Extra days must be a whole number from 0 to 3650.");
  if (!order.message.trim() || order.message.length > 5000)
    throw new Error("The change order message must be 1 to 5,000 characters.");
}
export function setChangeOrder(
  project: Project,
  proposalId: string,
  order: ChangeOrder,
): Project {
  checkChangeOrder(order);
  if (!project.proposals.some((p) => p.id === proposalId))
    throw new Error("This change no longer exists.");
  return {
    ...project,
    proposals: project.proposals.map((p) =>
      p.id === proposalId ? { ...p, changeOrder: order } : p,
    ),
  };
}
export function setRevisionPolicy(
  project: Project,
  policy: RevisionPolicy | undefined,
): Project {
  if (policy) {
    if (
      !Number.isSafeInteger(policy.limit) ||
      policy.limit < 0 ||
      policy.limit > 100
    )
      throw new Error(
        "Included revisions must be a whole number from 0 to 100.",
      );
    checkEvidence(project, policy);
  }
  return { ...project, revisionPolicy: policy };
}
export function saveRevision(project: Project, revision: Revision): Project {
  if (!revision.note.trim() || revision.note.length > 2000)
    throw new Error("Describe the revision request (up to 2,000 characters).");
  if (!validDay(revision.requestedAt))
    throw new Error("Enter a valid request date.");
  checkEvidence(project, revision);
  if (revision.changeOrder) checkChangeOrder(revision.changeOrder);
  const revisions = project.revisions || [];
  return {
    ...project,
    revisions: revisions.some((r) => r.id === revision.id)
      ? revisions.map((r) => (r.id === revision.id ? revision : r))
      : [...revisions, revision],
  };
}
export function revisionUsage(project: Project) {
  const used = (project.revisions || []).filter((r) => r.counts).length;
  const limit = project.revisionPolicy?.limit;
  return {
    used,
    limit,
    over: limit !== undefined && used > limit,
    exhausted: limit !== undefined && used >= limit,
  };
}
export function revisionSummary(project: Project) {
  const { used, limit } = revisionUsage(project);
  const policy = project.revisionPolicy;
  return !policy || limit === undefined
    ? `Included revisions: unknown. Revisions logged: ${used}.`
    : `Included revisions: ${limit} (${policy.manual ? "manually entered" : `source ${policy.sourceId}`}). Revisions used: ${used}.`;
}
export function formatAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
// Builds an editable draft for the user to send manually; never sends anything.
export function changeOrderMessage(input: {
  client: string;
  kind: "scope" | "revision";
  request: string;
  version?: number;
  limit?: number;
  amount?: number;
  currency: string;
  extraDays?: number;
  tone: "concise" | "detailed";
}) {
  const cost =
    input.amount !== undefined
      ? `The additional cost would be ${formatAmount(input.amount, input.currency)}`
      : "I'll confirm the additional cost with you before starting";
  const time =
    input.extraDays === undefined
      ? "I'll confirm any change to the delivery date"
      : input.extraDays === 0
        ? "it would not change the delivery date"
        : `it would add ${input.extraDays} working day${input.extraDays === 1 ? "" : "s"} to the delivery date`;
  const context =
    input.kind === "revision"
      ? input.limit === undefined
        ? "This goes beyond the revisions included in our agreement."
        : `This goes beyond the ${input.limit} revision${input.limit === 1 ? "" : "s"} included in our agreement.`
      : `This isn't part of the scope we agreed${input.version ? ` (brief v${input.version})` : ""}.`;
  if (input.tone === "concise")
    return `Hi ${input.client}, thanks for the request:\n\n"${input.request}"\n\n${context} ${cost}, and ${time}.\n\nShould I go ahead?`;
  return `Hi ${input.client},\n\nThank you for sending this over. I'd be glad to help with:\n\n"${input.request}"\n\n${context} To keep things clear for both of us, here is what it would involve:\n\n- ${cost}.\n- ${time.charAt(0).toUpperCase()}${time.slice(1)}.\n\nIf you're happy with this, please reply to confirm and I'll add it to the plan. If you'd prefer to keep the original scope, that's completely fine too.\n\nBest regards`;
}
