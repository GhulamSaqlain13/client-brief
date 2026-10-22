import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addCapture,
  approve,
  contentHash,
  createProject,
  markdown,
  type Capture,
} from "../lib/model";
async function source(text: string): Promise<Capture> {
  return {
    id: crypto.randomUUID(),
    text,
    url: "",
    capturedAt: new Date().toISOString(),
    hash: await contentHash(text),
  };
}
test("missing budget and timeline remain unknown; extraction keeps exact evidence", async () => {
  const p = addCapture(
    createProject("Site", "Client", "Independent"),
    await source("We need a responsive homepage."),
  );
  assert.equal(p.items[0].excerpt, "We need a responsive homepage.");
  const output = markdown(approve(p));
  assert.match(output, /## budget\nunknown/);
  assert.match(output, /## timeline\nunknown/);
});
test("new messages cannot mutate an approved baseline and block approval until review", async () => {
  const p = approve(
    addCapture(
      createProject("Site", "Client", "Independent"),
      await source("Budget is $500."),
    ),
  );
  const before = structuredClone(p.versions[0]);
  const next = addCapture(p, await source("Budget is $200."));
  assert.deepEqual(next.versions[0], before);
  assert.deepEqual(next.items, p.items);
  assert.equal(next.proposals.length, 1);
  assert.equal(next.proposals[0].before, "Budget is $500.");
  assert.throws(() => approve(next), /pending changes/);
});
test("duplicate captures are rejected, including whitespace-only differences", async () => {
  const p = addCapture(
    createProject("Site", "Client", "Independent"),
    await source("Build a homepage."),
  );
  assert.throws(
    () => addCapture(p, { ...p.sources[0], id: "different" }),
    /already been captured/,
  );
  assert.equal(await contentHash(" Build  a homepage.\n"), p.sources[0].hash);
});
test("baseline approval requires source evidence or an explicit manual item", () => {
  const p = createProject("Site", "Client", "Independent");
  p.items = [
    {
      id: "a",
      section: "requirements",
      text: "Unsubstantiated",
      state: "proposed",
    },
  ];
  assert.throws(() => approve(p), /valid source evidence/);
  p.items[0].manual = true;
  assert.equal(approve(p).items[0].state, "confirmed");
});
test("export uses the approved snapshot rather than unapproved working edits", async () => {
  const p = approve(
    addCapture(
      createProject("Site", "Client", "Independent"),
      await source("Build a homepage."),
    ),
  );
  p.items[0].text = "Unapproved change";
  assert.match(markdown(p), /Build a homepage/);
  assert.doesNotMatch(markdown(p), /Unapproved change/);
  assert.throws(
    () => markdown(createProject("Empty", "Client", "Independent")),
    /Approve a baseline/,
  );
});
