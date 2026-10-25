import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addCapture,
  approve,
  changeOrderMessage,
  contentHash,
  createProject,
  csv,
  editItem,
  id,
  markdown,
  redact,
  removeCapture,
  reviewProposal,
  revisionSummary,
  revisionUsage,
  saveRevision,
  setChangeOrder,
  setRevisionPolicy,
  type Capture,
} from "../lib/model";
import { parseBackup, validateStore } from "../lib/validation";
const source = async (text: string): Promise<Capture> => ({
  id: id(),
  text,
  url: "",
  capturedAt: new Date().toISOString(),
  hash: await contentHash(text),
});
test("restore rejects malformed projects, invalid states, and dangling evidence", async () => {
  const p = addCapture(
    createProject("Site", "Client", "Independent"),
    await source("Build a homepage."),
  );
  const valid = { projects: [p], drafts: {}, revision: 2 };
  assert.equal(parseBackup(JSON.stringify(valid)).projects[0].title, "Site");
  assert.throws(() => parseBackup("{not json"), /valid JSON/);
  assert.throws(
    () => validateStore({ ...valid, projects: [{ ...p, title: 5 }] }),
    /invalid/i,
  );
  assert.throws(
    () =>
      validateStore({
        ...valid,
        projects: [{ ...p, items: [{ ...p.items[0], state: "invented" }] }],
      }),
    /Invalid status/,
  );
  assert.throws(
    () => validateStore({ ...valid, projects: [{ ...p, sources: [] }] }),
    /source evidence/,
  );
  assert.throws(
    () => validateStore({ ...valid, drafts: { missing: "orphan draft" } }),
    /unknown project/,
  );
});
test("manual edit and removal remain proposals until explicitly reviewed", async () => {
  const p = approve(
    addCapture(
      createProject("Site", "Client", "Independent"),
      await source("Budget is $500."),
    ),
  );
  const changed = editItem(p, {
    ...p.items[0],
    text: "Budget is $200.",
    manual: true,
  });
  assert.equal(changed.items[0].text, "Budget is $500.");
  const reviewed = reviewProposal(
    changed,
    changed.proposals[0].id,
    "accept",
    "budget change",
    "Client confirmed.",
  );
  assert.equal(reviewed.items[0].text, "Budget is $200.");
  assert.equal(reviewed.versions[0].items[0].text, "Budget is $500.");
  assert.equal(reviewed.proposals[0].reason, "Client confirmed.");
  const removal = editItem(reviewed, reviewed.items[0], true);
  const result = reviewProposal(
    removal,
    removal.proposals[1].id,
    "accept",
    "scope reduction",
    "Removed by client.",
  );
  assert.equal(result.items.length, 0);
  assert.equal(result.versions[0].items.length, 1);
  assert.equal(approve(result).versions.at(-1)?.items.length, 0);
});
test("capture deletion purges historical and proposal copies of source text", async () => {
  const p = approve(
    addCapture(
      createProject("Site", "Client", "Independent"),
      await source("Budget is $500."),
    ),
  );
  const next = addCapture(p, await source("Budget is $200."));
  const result = removeCapture(next, p.sources[0].id);
  assert.doesNotMatch(JSON.stringify(result), /Budget is \$500/);
  assert.equal(result.versionSequence, 1);
  const restored = editItem(result, {
    id: id(),
    section: "requirements",
    text: "Manually entered",
    manual: true,
    state: "proposed",
  });
  assert.equal(approve(restored).versions[0].number, 2);
});
test("ambiguous or contradicted information cannot become an approved baseline", () => {
  const p = createProject("Site", "Client", "Independent");
  p.items = [
    {
      id: id(),
      section: "requirements",
      text: "Maybe a homepage",
      state: "ambiguous",
      manual: true,
    },
  ];
  assert.throws(() => approve(p), /Resolve ambiguous/);
});
test("redaction removes common sensitive patterns and CSV protects formulas", () => {
  assert.equal(
    redact("Email alex@example.com password: abc123 +923001234567"),
    "Email [email removed] password: [removed] [phone removed]",
  );
  const p = createProject("Site", "Client", "Independent");
  p.items = [
    {
      id: id(),
      section: "requirements",
      text: '=HYPERLINK("https://example.com")',
      manual: true,
      state: "proposed",
    },
  ];
  assert.match(csv(approve(p)), /"'=HYPERLINK/);
});
test("milestone dependency cycles are rejected during storage validation", () => {
  const p = createProject("Site", "Client", "Independent");
  p.milestones = [
    {
      id: "a",
      title: "A",
      due: "",
      status: "planned",
      acceptance: "",
      dependency: "b",
    },
    {
      id: "b",
      title: "B",
      due: "",
      status: "planned",
      acceptance: "",
      dependency: "a",
    },
  ];
  assert.throws(
    () => validateStore({ projects: [p], drafts: {} }),
    /cannot form a cycle/,
  );
});
test("exclusions are organized into their own section and exported", async () => {
  const p = addCapture(
    createProject("Site", "Client", "Independent"),
    await source("Build a homepage.\nLogo design is not included."),
  );
  assert.deepEqual(
    p.items.map((i) => i.section),
    ["requirements", "exclusions"],
  );
  assert.match(
    markdown(approve(p)),
    /## exclusions\n- Logo design is not included\./,
  );
});
test("revision limit is never guessed and usage flags requests beyond it", async () => {
  let p = addCapture(
    createProject("Logo", "Client", "Fiverr"),
    await source("The package includes 2 revisions."),
  );
  assert.equal(revisionUsage(p).limit, undefined);
  assert.match(revisionSummary(p), /unknown/);
  assert.throws(
    () =>
      setRevisionPolicy(p, {
        limit: 2,
        sourceId: p.sources[0].id,
        excerpt: "3 revisions",
      }),
    /exact words/,
  );
  p = setRevisionPolicy(p, {
    limit: 2,
    sourceId: p.sources[0].id,
    excerpt: "includes 2 revisions",
  });
  const revision = (note: string, counts = true) => ({
    id: id(),
    note,
    deliverable: "",
    requestedAt: "2026-10-20",
    status: "requested" as const,
    counts,
    manual: true,
  });
  p = saveRevision(p, revision("Change colors"));
  p = saveRevision(p, revision("Fix my typo", false));
  p = saveRevision(p, revision("Bigger font"));
  assert.deepEqual(revisionUsage(p), {
    used: 2,
    limit: 2,
    over: false,
    exhausted: true,
  });
  p = saveRevision(p, revision("New icon"));
  assert.equal(revisionUsage(p).over, true);
  assert.throws(
    () => saveRevision(p, { ...revision("Bad"), requestedAt: "2026-02-30" }),
    /valid request date/,
  );
  const restored = parseBackup(JSON.stringify({ projects: [p], drafts: {} }))
    .projects[0];
  assert.equal(restored.revisions?.length, 4);
  assert.equal(removeCapture(p, p.sources[0].id).revisionPolicy, undefined);
});
test("change orders keep user-entered price and are validated on restore", async () => {
  let p = approve(
    addCapture(
      createProject("Site", "Client", "Upwork"),
      await source("Build a homepage."),
    ),
  );
  p = addCapture(p, await source("Can you also add a blog?"));
  const proposal = p.proposals[0];
  const message = changeOrderMessage({
    client: "Client",
    kind: "scope",
    request: proposal.item.text,
    version: 1,
    currency: "",
    tone: "concise",
  });
  assert.match(message, /isn't part of the scope we agreed \(brief v1\)/);
  assert.match(message, /confirm the additional cost/);
  assert.doesNotMatch(message, /\d+\.\d\d|\$/);
  const order = {
    amount: 150,
    currency: "USD",
    extraDays: 3,
    message: "Hi",
    status: "sent" as const,
    updatedAt: new Date().toISOString(),
  };
  assert.throws(
    () => setChangeOrder(p, proposal.id, { ...order, amount: 1.234 }),
    /2 decimals/,
  );
  assert.throws(
    () => setChangeOrder(p, proposal.id, { ...order, currency: "usd" }),
    /currency code/,
  );
  p = setChangeOrder(p, proposal.id, order);
  assert.deepEqual(p.proposals[0].item, proposal.item);
  assert.equal(p.proposals[0].status, "pending");
  const backup = JSON.parse(JSON.stringify({ projects: [p], drafts: {} }));
  assert.equal(
    parseBackup(JSON.stringify(backup)).projects[0].proposals[0].changeOrder
      ?.amount,
    150,
  );
  backup.projects[0].proposals[0].changeOrder.amount = -5;
  assert.throws(() => parseBackup(JSON.stringify(backup)), /positive amount/);
});
