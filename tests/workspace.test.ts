import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addCapture,
  approve,
  contentHash,
  createProject,
  csv,
  editItem,
  id,
  redact,
  removeCapture,
  reviewProposal,
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
