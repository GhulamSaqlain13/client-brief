import {
  checkEvidence,
  formatAmount,
  id,
  revisionUsage,
  validDay,
  type ChecklistItem,
  type ClientRecord,
  type Confirmation,
  type Item,
  type Payment,
  type Project,
  type Store,
} from "./model";
import { templates } from "./templates";

export function applyTemplate(project: Project, template: string): Project {
  const t = templates[template];
  if (!t) throw new Error("Unknown project type.");
  const existing = new Set(
    (project.checklist || []).map((c) => c.label.toLowerCase()),
  );
  return {
    ...project,
    template,
    checklist: [
      ...(project.checklist || []),
      ...t.checklist
        .filter((label) => !existing.has(label.toLowerCase()))
        .map((label) => ({ id: id(), label, status: "missing" as const })),
    ],
  };
}
export function saveChecklistItem(
  project: Project,
  item: ChecklistItem,
): Project {
  if (!item.label.trim() || item.label.length > 200)
    throw new Error("Enter a checklist item (up to 200 characters).");
  if ((item.note || "").length > 1000)
    throw new Error("Notes can be up to 1,000 characters.");
  const list = project.checklist || [];
  return {
    ...project,
    checklist: list.some((c) => c.id === item.id)
      ? list.map((c) => (c.id === item.id ? item : c))
      : [...list, item],
  };
}
export function readiness(project: Project) {
  const relevant = (project.checklist || []).filter(
    (c) => c.status !== "not needed",
  );
  const received = relevant.filter((c) => c.status === "received").length;
  return {
    received,
    total: relevant.length,
    percent: relevant.length
      ? Math.round((received / relevant.length) * 100)
      : undefined,
  };
}
export function savePayment(project: Project, payment: Payment): Project {
  if (!payment.title.trim() || payment.title.length > 200)
    throw new Error("Enter a payment name (up to 200 characters).");
  if (payment.due && !validDay(payment.due))
    throw new Error("Enter a valid due date.");
  if (payment.amount !== undefined) {
    if (
      !Number.isFinite(payment.amount) ||
      payment.amount < 0 ||
      payment.amount > 1e9 ||
      Math.abs(Math.round(payment.amount * 100) - payment.amount * 100) > 1e-6
    )
      throw new Error(
        "Enter the amount as a positive number with up to 2 decimals.",
      );
    if (!/^[A-Z]{3}$/.test(payment.currency))
      throw new Error("Enter a 3-letter currency code, such as USD.");
  }
  checkEvidence(project, payment);
  // A source-linked amount must appear in the quoted words, so it is never guessed.
  if (!payment.manual && payment.amount !== undefined) {
    const quoted = (payment.excerpt || "").replace(/[\s,]/g, "");
    const plain = String(payment.amount);
    if (!quoted.includes(plain) && !quoted.includes(payment.amount.toFixed(2)))
      throw new Error(
        "The amount must appear in the quoted words. Quote the message that states it, or mark the payment as entered manually.",
      );
  }
  if (payment.status === "paid" && payment.paidAt && !validDay(payment.paidAt))
    throw new Error("Enter a valid paid date.");
  const list = project.payments || [];
  return {
    ...project,
    payments: list.some((p) => p.id === payment.id)
      ? list.map((p) => (p.id === payment.id ? payment : p))
      : [...list, payment],
  };
}
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export function paymentState(payment: Payment, now = today()) {
  if (payment.status === "paid") return "paid";
  return payment.due && payment.due < now ? "overdue" : "due";
}
export function paymentTotals(project: Project, now = today()) {
  const totals: Record<string, { paid: number; due: number; overdue: number }> =
    {};
  for (const p of project.payments || []) {
    if (p.amount === undefined) continue;
    const t = (totals[p.currency] ||= { paid: 0, due: 0, overdue: 0 });
    t[paymentState(p, now)] += p.amount;
  }
  return totals;
}
export function recordConfirmation(
  project: Project,
  confirmation: Confirmation,
): Project {
  if (!project.versions.some((v) => v.number === confirmation.version))
    throw new Error("Choose an approved version.");
  checkEvidence(project, confirmation);
  return {
    ...project,
    confirmations: [...(project.confirmations || []), confirmation],
  };
}
const listOf = (items: Item[], empty: string) =>
  items.length ? items.map((i) => `- ${i.text}`).join("\n") : `- ${empty}`;
// Client-facing plain text built only from the approved snapshot.
export function clientSummary(project: Project) {
  const version = project.versions.at(-1);
  if (!version) throw new Error("Approve a baseline before sharing a summary.");
  const of = (section: Item["section"]) =>
    version.items.filter((i) => i.section === section);
  const open = project.items.filter(
    (i) =>
      i.section === "questions" &&
      !["answered", "no longer needed"].includes(i.questionStatus || "open"),
  );
  const usage = revisionUsage(project);
  const payments = (project.payments || []).filter(
    (p) => p.amount !== undefined,
  );
  return [
    `Hi ${project.client},`,
    `Here is a summary of what we agreed for "${project.title}" (brief v${version.number}, ${new Date(version.approvedAt).toLocaleDateString()}). Please reply "Confirmed" if this matches your understanding, or tell me what should change.`,
    ...(of("overview").length ? [`Goal:\n${listOf(of("overview"), "")}`] : []),
    `What's included:\n${listOf(of("requirements"), "Not agreed yet")}`,
    `Deliverables:\n${listOf(of("deliverables"), "Not agreed yet")}`,
    `Not included:\n${listOf(of("exclusions"), "Anything not listed above")}`,
    `Timeline:\n${listOf(of("timeline"), "Not agreed yet")}`,
    `Budget & payment:\n${listOf(of("budget"), "Not agreed yet")}${
      payments.length
        ? "\n" +
          payments
            .map(
              (p) =>
                `- ${p.title}: ${formatAmount(p.amount!, p.currency)}${p.due ? ` due ${p.due}` : ""}`,
            )
            .join("\n")
        : ""
    }`,
    `Revisions included: ${usage.limit ?? "not agreed yet"}`,
    ...(open.length
      ? [`Still to confirm:\n${open.map((q) => `- ${q.text}`).join("\n")}`]
      : []),
    "Thank you!",
  ].join("\n\n");
}
export type Attention = {
  projectId: string;
  project: string;
  kind: "overdue" | "soon" | "waiting" | "review";
  label: string;
  date?: string;
};
// Items that need the user's attention across active projects.
export function attention(store: Store, now = today()): Attention[] {
  const ageDays = store.settings?.questionAgeDays ?? 3;
  const soon = addDays(now, 7);
  const stale = addDays(now, -ageDays);
  const result: Attention[] = [];
  for (const p of store.projects.filter((p) => !p.archived)) {
    const base = { projectId: p.id, project: p.title };
    for (const m of p.milestones || [])
      if (m.status !== "completed" && m.due)
        if (m.due < now)
          result.push({
            ...base,
            kind: "overdue",
            label: `Milestone overdue: ${m.title}`,
            date: m.due,
          });
        else if (m.due <= soon)
          result.push({
            ...base,
            kind: "soon",
            label: `Milestone due: ${m.title}`,
            date: m.due,
          });
    for (const pay of p.payments || []) {
      const state = paymentState(pay, now);
      const amount =
        pay.amount !== undefined
          ? ` (${formatAmount(pay.amount, pay.currency)})`
          : "";
      if (state === "overdue")
        result.push({
          ...base,
          kind: "overdue",
          label: `Payment overdue: ${pay.title}${amount}`,
          date: pay.due,
        });
      else if (state === "due" && pay.due && pay.due <= soon)
        result.push({
          ...base,
          kind: "soon",
          label: `Payment due: ${pay.title}${amount}`,
          date: pay.due,
        });
    }
    for (const q of p.items.filter((i) => i.section === "questions")) {
      const status = q.questionStatus || "open";
      if (!["open", "asked"].includes(status)) continue;
      const since =
        q.questionUpdatedAt ||
        p.sources.find((s) => s.id === q.sourceId)?.capturedAt ||
        p.createdAt;
      if (since.slice(0, 10) <= stale)
        result.push({
          ...base,
          kind: "waiting",
          label: `${status === "asked" ? "No answer" : "Not asked"} for ${ageDays}+ days: ${q.text}`,
          date: since.slice(0, 10),
        });
    }
    const pending = p.proposals.filter((c) => c.status === "pending").length;
    if (pending)
      result.push({
        ...base,
        kind: "review",
        label: `${pending} scope change${pending === 1 ? "" : "s"} to review`,
      });
  }
  const order = { overdue: 0, soon: 1, waiting: 2, review: 3 };
  return result.sort(
    (a, b) =>
      order[a.kind] - order[b.kind] ||
      (a.date || "").localeCompare(b.date || ""),
  );
}
export function clientNames(store: Store) {
  return [
    ...new Set([
      ...(store.clients || []).map((c) => c.name),
      ...store.projects.map((p) => p.client),
    ]),
  ].sort((a, b) => a.localeCompare(b));
}
export function clientStats(store: Store, name: string) {
  const projects = store.projects.filter((p) => p.client === name);
  const proposals = projects.flatMap((p) => p.proposals);
  const expansions = proposals.filter(
    (c) =>
      c.status === "accepted" &&
      ["new feature", "scope expansion"].includes(c.category || ""),
  ).length;
  const revisions = projects.map((p) => revisionUsage(p));
  const extraRevisions = revisions.reduce(
    (n, r) => n + (r.limit === undefined ? 0 : Math.max(0, r.used - r.limit)),
    0,
  );
  const orders = [
    ...proposals.map((c) => c.changeOrder),
    ...projects.flatMap((p) => (p.revisions || []).map((r) => r.changeOrder)),
  ].filter((o) => o?.status === "accepted by client");
  const accepted: Record<string, number> = {};
  for (const o of orders)
    if (o?.amount !== undefined)
      accepted[o.currency] = (accepted[o.currency] || 0) + o.amount;
  return {
    projects: projects.length,
    active: projects.filter((p) => !p.archived).length,
    completed: projects.filter((p) => p.status === "completed").length,
    scopeChanges: expansions,
    changesPerProject: projects.length ? expansions / projects.length : 0,
    avgRevisions: projects.length
      ? revisions.reduce((n, r) => n + r.used, 0) / projects.length
      : 0,
    extraRevisions,
    acceptedChangeOrders: accepted,
    overduePayments: projects
      .flatMap((p) => p.payments || [])
      .filter((p) => paymentState(p) === "overdue").length,
  };
}
export function saveClient(
  store: Store,
  client: ClientRecord,
  originalName?: string,
): Store {
  const name = client.name.trim();
  if (!name || name.length > 100)
    throw new Error("Enter a client name (up to 100 characters).");
  if ((client.notes || "").length > 5000)
    throw new Error("Client notes can be up to 5,000 characters.");
  const clients = store.clients || [];
  const previous = clients.find((c) => c.id === client.id);
  const previousName = previous?.name ?? originalName;
  const taken = clientNames(store).some(
    (n) =>
      n.toLowerCase() === name.toLowerCase() &&
      n.toLowerCase() !== previousName?.toLowerCase(),
  );
  if (taken) throw new Error("A client with this name already exists.");
  const next = { ...client, name };
  return {
    ...store,
    clients: previous
      ? clients.map((c) => (c.id === client.id ? next : c))
      : [...clients, next],
    // Renaming a client renames it on every project that uses it.
    projects: previousName
      ? store.projects.map((p) =>
          p.client === previousName ? { ...p, client: name } : p,
        )
      : store.projects,
  };
}
export function deleteClient(store: Store, clientId: string): Store {
  const client = store.clients?.find((c) => c.id === clientId);
  if (!client) throw new Error("This client no longer exists.");
  if (store.projects.some((p) => p.client === client.name))
    throw new Error(
      "Delete or reassign this client's projects before deleting the client.",
    );
  return {
    ...store,
    clients: store.clients!.filter((c) => c.id !== clientId),
  };
}
// Ensures every client name used by a project has a record, for editing.
export function clientRecord(store: Store, name: string): ClientRecord {
  return (
    store.clients?.find((c) => c.name === name) || {
      id: id(),
      name,
      createdAt: new Date().toISOString(),
    }
  );
}
