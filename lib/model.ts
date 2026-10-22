export const sections = [
  "overview",
  "requirements",
  "deliverables",
  "timeline",
  "budget",
  "questions",
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
};
export type Capture = {
  id: string;
  text: string;
  url: string;
  capturedAt: string;
  hash: string;
};
export type Version = { number: number; approvedAt: string; items: Item[] };
export type Proposal = {
  id: string;
  item: Item;
  before: string;
  status: "pending" | "accepted" | "rejected";
  operation?: "upsert" | "remove";
  category?: string;
  reviewedAt?: string;
  reason?: string;
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
};
export type Store = {
  projects: Project[];
  drafts: Record<string, string>;
  revision?: number;
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
  return source.text
    .split(/\n+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((text) => {
      let section: Section = "requirements";
      if (/\?\s*$/.test(text)) section = "questions";
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
        excerpt: text,
        state: "proposed",
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
  return {
    ...project,
    sources: project.sources.filter((s) => s.id !== sourceId),
    items: project.items.filter((i) => !affected(i)),
    proposals: project.proposals.filter(
      (p) => !affected(p.item) && !affectedSections.has(p.item.section),
    ),
    versions: project.versions.filter((v) => !v.items.some(affected)),
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
