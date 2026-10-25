import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addCapture,
  approve,
  contentHash,
  createProject,
  id,
  markdown,
  removeCapture,
  type Capture,
  type Store,
} from "../lib/model";
import {
  knownSpeakers,
  parseLine,
  sortByTime,
  splitThread,
} from "../lib/conversation";
import {
  applyTemplate,
  attention,
  clientStats,
  clientSummary,
  deleteClient,
  readiness,
  recordConfirmation,
  saveClient,
  savePayment,
} from "../lib/planning";
import { parseBackup } from "../lib/validation";
const source = async (text: string): Promise<Capture> => ({
  id: id(),
  text,
  url: "",
  capturedAt: "2026-10-01T10:00:00.000Z",
  hash: await contentHash(text),
});
test("speaker lines are parsed without mistaking labels for people", async () => {
  const text =
    "Sara: We need a logo.\nMe: Sure.\nSara: Budget: $300\nBudget: unknown\n[2026-10-20 14:05] Sara: Deliver PNG files.";
  assert.deepEqual(knownSpeakers(text).sort(), ["Me", "Sara"]);
  assert.equal(
    parseLine("Budget: unknown", knownSpeakers(text)).speaker,
    undefined,
  );
  const p = addCapture(
    createProject("Logo", "Sara", "Fiverr"),
    await source(text),
  );
  const logo = p.items.find((i) => i.text === "We need a logo.")!;
  assert.equal(logo.speaker, "Sara");
  assert.equal(logo.excerpt, "Sara: We need a logo.");
  const files = p.items.find((i) => i.text === "Deliver PNG files.")!;
  assert.equal(files.sentAt, "2026-10-20 14:05");
  assert.equal(files.section, "deliverables");
  assert.equal(
    p.items.find((i) => i.text === "Budget: $300")?.section,
    "budget",
  );
});
test("messages sort by written time and long threads split at lines", () => {
  const sorted = sortByTime(
    "[2026-10-20 14:05] Sara: second\ncontinued\n[2026-10-19 09:00] Sara: first",
  );
  assert.equal(
    sorted,
    "[2026-10-19 09:00] Sara: first\n[2026-10-20 14:05] Sara: second\ncontinued",
  );
  assert.equal(sortByTime("no times here"), undefined);
  const parts = splitThread("a".repeat(60) + "\n" + "b".repeat(60), 100);
  assert.deepEqual(parts, ["a".repeat(60), "b".repeat(60)]);
  assert.equal(splitThread("x".repeat(250), 100).length, 3);
});
test("rule-based hints pre-classify budget changes and excluded requests", async () => {
  let p = approve(
    addCapture(
      createProject("Site", "Client", "Upwork"),
      await source("Budget is $500.\nLogo design is not included."),
    ),
  );
  p = addCapture(p, await source("Budget is $650.\nCan you design a logo"));
  const budget = p.proposals.find((x) => x.item.section === "budget")!;
  assert.equal(budget.category, "budget change");
  assert.match(budget.hint!, /\$650.*\$500/);
  const logo = p.proposals.find(
    (x) => x.item.text === "Can you design a logo",
  )!;
  assert.equal(logo.category, "scope expansion");
  assert.match(logo.hint!, /not included/);
  assert.equal(p.versions[0].items.length, 2);
});
test("templates add a checklist once and readiness ignores not-needed items", () => {
  let p = applyTemplate(createProject("Site", "Client", "Upwork"), "web");
  const count = p.checklist!.length;
  p = applyTemplate(p, "web");
  assert.equal(p.checklist!.length, count);
  p.checklist = p.checklist!.map((c, i) => ({
    ...c,
    status: i === 0 ? "received" : i === 1 ? "not needed" : "missing",
  }));
  assert.deepEqual(readiness(p), {
    received: 1,
    total: count - 1,
    percent: Math.round((1 / (count - 1)) * 100),
  });
});
test("payments keep stated amounts and overdue items reach the attention list", async () => {
  let p = addCapture(
    createProject("Site", "Client", "Upwork"),
    await source("Deposit of $250 due before we start."),
  );
  const base = {
    id: id(),
    title: "Deposit",
    currency: "USD",
    due: "2026-10-01",
    status: "due" as const,
    sourceId: p.sources[0].id,
    excerpt: "Deposit of $250",
  };
  assert.throws(() => savePayment(p, { ...base, amount: 300 }), /must appear/);
  p = savePayment(p, { ...base, amount: 250 });
  p.milestones = [
    {
      id: id(),
      title: "Design",
      due: "2026-10-28",
      status: "planned",
      acceptance: "",
    },
  ];
  const store: Store = { projects: [p], drafts: {} };
  const items = attention(store, "2026-10-25");
  assert.deepEqual(
    items.map((i) => i.kind),
    ["overdue", "soon"],
  );
  assert.match(items[0].label, /Deposit \(\$250\.00\)/);
  assert.match(markdown(approve(p)), /Deposit: \$250\.00; due 2026-10-01/);
  assert.equal(
    parseBackup(JSON.stringify(store)).projects[0].payments![0].amount,
    250,
  );
  assert.equal(removeCapture(p, p.sources[0].id).payments!.length, 0);
});
test("client summary uses approved scope and confirmation needs a quoted reply", async () => {
  let p = approve(
    addCapture(
      createProject("Site", "Acme", "Upwork"),
      await source("Build a homepage.\nHosting is not included."),
    ),
  );
  const summary = clientSummary(p);
  assert.match(summary, /What's included:\n- Build a homepage\./);
  assert.match(summary, /Not included:\n- Hosting is not included\./);
  assert.match(summary, /Timeline:\n- Not agreed yet/);
  assert.match(summary, /Revisions included: not agreed yet/);
  p = addCapture(p, await source("Confirmed, looks good!"));
  const reply = p.sources[1];
  assert.throws(
    () =>
      recordConfirmation(p, {
        id: id(),
        version: 1,
        sourceId: reply.id,
        excerpt: "Approved",
        recordedAt: new Date().toISOString(),
      }),
    /exact words/,
  );
  p = recordConfirmation(p, {
    id: id(),
    version: 1,
    sourceId: reply.id,
    excerpt: "Confirmed, looks good!",
    recordedAt: new Date().toISOString(),
  });
  assert.equal(p.confirmations!.length, 1);
  assert.equal(removeCapture(p, reply.id).confirmations!.length, 0);
});
test("client records rename projects, block deletion in use, and report history", () => {
  const p = createProject("Site", "Acme", "Upwork");
  p.proposals = [
    {
      id: id(),
      item: {
        id: id(),
        section: "requirements",
        text: "Blog",
        state: "proposed",
        manual: true,
      },
      before: "unknown",
      status: "accepted",
      category: "new feature",
    },
  ];
  let store: Store = { projects: [p], drafts: {} };
  store = saveClient(
    store,
    { id: "c1", name: "Acme Ltd", createdAt: new Date().toISOString() },
    "Acme",
  );
  assert.equal(store.projects[0].client, "Acme Ltd");
  assert.throws(
    () =>
      saveClient(store, {
        id: "c2",
        name: "acme ltd",
        createdAt: new Date().toISOString(),
      }),
    /already exists/,
  );
  assert.throws(() => deleteClient(store, "c1"), /reassign/);
  assert.equal(clientStats(store, "Acme Ltd").scopeChanges, 1);
  assert.equal(parseBackup(JSON.stringify(store)).clients![0].name, "Acme Ltd");
});
