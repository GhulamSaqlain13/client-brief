import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";

const root = path.resolve("out");
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const file = path.resolve(
      root,
      "." + (pathname.endsWith("/") ? pathname + "index.html" : pathname),
    );
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    const mime = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".woff2": "font/woff2",
    };
    res.setHeader(
      "Content-Type",
      mime[path.extname(file)] || "application/octet-stream",
    );
    res.setHeader(
      "Content-Security-Policy",
      "script-src 'self'; object-src 'self';",
    );
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
await mkdir("artifacts", { recursive: true });
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
let page;
try {
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  page = await context.newPage();
  const errors = [];
  const network = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (/Content Security Policy|Refused to execute/.test(message.text()))
      errors.push(message.text());
  });
  page.on("request", (req) => {
    if (!req.url().startsWith(base) && !req.url().startsWith("blob:"))
      network.push(req.url());
  });
  async function click(name) {
    await page.getByRole("button", { name, exact: true }).click();
  }
  async function confirm(name) {
    await page
      .getByRole("dialog")
      .getByRole("button", { name, exact: true })
      .click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
  }
  async function approveBaseline() {
    await click("Approve baseline");
    await confirm("Approve baseline");
  }
  async function capture(text) {
    await page
      .getByRole("button", { name: "Add conversation", exact: true })
      .first()
      .click();
    await page.getByLabel("Conversation", { exact: true }).fill(text);
    await confirm("Confirm capture & organize");
  }
  await page.goto(base);
  await click("Create your first project");
  await page
    .getByLabel("Project name", { exact: true })
    .fill("Studio website redesign");
  await page
    .getByLabel("Client name", { exact: true })
    .fill("Northstar Studio");
  await confirm("Create project");
  await page
    .getByRole("button", { name: "ClientBrief workspace", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Studio website redesign", exact: true })
    .click();
  await capture(
    "Build a responsive homepage.\nBudget is $500.\nWho will provide the content?",
  );
  await page
    .getByText("Build a responsive homepage.", { exact: true })
    .first()
    .waitFor();
  await approveBaseline();
  await page.getByText("Baseline v1", { exact: true }).waitFor();
  await capture("Budget is $200.");
  await click("Replace section");
  await confirm("Replace section");
  await page.getByRole("tab", { name: "Project brief", exact: true }).click();
  await approveBaseline();
  await page.getByText("Baseline v2", { exact: true }).waitFor();
  await page.reload();
  await page.getByText("Baseline v2", { exact: true }).waitFor();
  assert.equal(
    await page.getByText("Budget is $500.", { exact: true }).count(),
    0,
  );
  for (const format of ["Markdown", "JSON", "CSV"]) {
    const promise = page.waitForEvent("download");
    await click(format);
    const download = await promise;
    assert.match(
      download.suggestedFilename(),
      new RegExp(`\\.${format === "Markdown" ? "md" : format.toLowerCase()}$`),
    );
    const text = await readFile(await download.path(), "utf8");
    assert.match(text, /200/);
    assert.doesNotMatch(text, /Budget is \$500/);
  }
  // Keyboard access and focus must remain inside a native modal.
  await click("Project settings");
  const dialog = page.getByRole("dialog");
  await page.keyboard.press("Tab");
  assert.equal(
    await dialog.evaluate((d) => d.contains(document.activeElement)),
    true,
  );
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  // Draft survives closing and reopening; duplicate capture has an actionable error.
  await click("Add conversation");
  await page
    .getByLabel("Conversation", { exact: true })
    .fill("Unsaved notes to finish later.");
  await click("Save draft & close");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await click("Add conversation");
  assert.equal(
    await page.getByLabel("Conversation", { exact: true }).inputValue(),
    "Unsaved notes to finish later.",
  );
  await page
    .getByLabel("Conversation", { exact: true })
    .fill("Budget is $200.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm capture & organize", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("alert")
    .filter({ hasText: "already been captured" })
    .waitFor();
  await page.getByLabel("Conversation", { exact: true }).fill("");
  await click("Save draft & close");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("tab", { name: "Questions", exact: true }).click();
  await page
    .getByRole("combobox", { name: /Question status:/ })
    .selectOption("asked");
  await page
    .getByRole("status")
    .filter({ hasText: "Question status updated" })
    .waitFor();
  await page.getByRole("tab", { name: "Milestones", exact: true }).click();
  await click("Add milestone");
  await page.getByLabel("Milestone name").fill("Design approval");
  await page
    .getByLabel("Acceptance criteria")
    .fill("Client approves the homepage layout.");
  await confirm("Save milestone");
  await page
    .getByRole("heading", { name: "Design approval", exact: true })
    .waitFor();
  // Malformed restore is rejected without changing current data, then valid restore works.
  await page.getByRole("button", { name: "Privacy settings" }).click();
  await page.getByLabel("Restore workspace backup").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"projects":[{}],"drafts":{}}'),
  });
  await page.getByRole("dialog").getByRole("alert").waitFor();
  const original = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("clientbrief-v1")),
  );
  await page.getByLabel("Restore workspace backup").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(original)),
  });
  await confirm("Replace workspace with backup");
  assert.equal(await page.getByLabel("Appearance").inputValue(), "system");
  await page
    .getByRole("button", { name: "Studio website redesign", exact: true })
    .click();
  await page.getByRole("tab", { name: "Project brief", exact: true }).click();
  // An editor opened before an external change must not silently overwrite it.
  await page.getByRole("button", { name: "Edit", exact: true }).first().click();
  await page.getByLabel("Details").fill("My local edit");
  const other = await context.newPage();
  await other.goto(base);
  await other.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("clientbrief-v1"));
    data.projects[0].notes = "Changed in another window";
    data.revision += 1;
    localStorage.setItem("clientbrief-v1", JSON.stringify(data));
  });
  await page.waitForFunction(() =>
    document.body.textContent.includes("Changed in another window"),
  );
  await page
    .getByRole("button", { name: "Propose change", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("alert")
    .filter({ hasText: "changed while you were editing" })
    .waitFor();
  await page.keyboard.press("Escape");
  await other.close();
  // Local text import and redaction happen before confirmation.
  await click("Add conversation");
  await page.getByLabel("Import conversation file").setInputFiles({
    name: "messages.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Contact alex@example.com\npassword: abc123"),
  });
  await click("Redact sensitive details");
  assert.doesNotMatch(
    await page.getByLabel("Conversation", { exact: true }).inputValue(),
    /alex@example.com|abc123/,
  );
  await page.getByLabel("Conversation", { exact: true }).fill("");
  await click("Save draft & close");
  // Archive filter and the client list are real navigation paths.
  await click("Archive");
  await confirm("Archive project");
  await click("All projects");
  await page.getByLabel("Project archive filter").selectOption("archived");
  await page
    .getByRole("button", { name: "Studio website redesign", exact: true })
    .click();
  await click("Unarchive");
  await confirm("Unarchive project");
  await page.getByRole("tab", { name: "Project brief", exact: true }).click();
  await click("Project settings");
  await page.getByLabel("Project name", { exact: true }).fill("A".repeat(110));
  await confirm("Save project");
  await page.setViewportSize({ width: 375, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    "Long project names must wrap",
  );
  await click("Project settings");
  await page
    .getByLabel("Project name", { exact: true })
    .fill("Studio website redesign");
  await confirm("Save project");
  await page.setViewportSize({ width: 1440, height: 1000 });
  // Both themes, real bundled font, realistic widths, long text and zoom-like text enlargement.
  for (const theme of ["light", "dark"]) {
    await page.getByLabel("Appearance").selectOption(theme);
    await page.reload();
    await page.getByText("Baseline v2", { exact: true }).waitFor();
    assert.equal(await page.getByLabel("Appearance").inputValue(), theme);
    const contrast = await page.evaluate(() => {
      const luminance = (rgb) => {
        const channels = rgb
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number)
          .map((c) => {
            const s = c / 255;
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          });
        return (
          channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
        );
      };
      const ratio = (a, b) => {
        const x = luminance(a),
          y = luminance(b);
        return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
      };
      const button = getComputedStyle(document.querySelector(".primary"));
      return {
        button: ratio(button.color, button.backgroundColor),
        secondary: ratio(
          getComputedStyle(document.querySelector(".heading-row p")).color,
          getComputedStyle(document.body).backgroundColor,
        ),
      };
    });
    assert.ok(
      contrast.button >= 4.5 && contrast.secondary >= 4.5,
      `${theme}: text contrast must meet 4.5:1`,
    );
    await page.evaluate(() => document.fonts.ready);
    assert.equal(
      await page.evaluate(() => document.fonts.check('15px "Inter Variable"')),
      true,
    );
    for (const width of [375, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `${theme} width ${width}`,
      );
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: `artifacts/dashboard-${theme}.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: `artifacts/panel-${theme}.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  await page.getByLabel("Appearance").selectOption("system");
  await page.emulateMedia({ colorScheme: "light" });
  await page.waitForFunction(
    () => document.documentElement.dataset.theme === "light",
  );
  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForFunction(
    () => document.documentElement.dataset.theme === "dark",
  );
  await page.evaluate(() => (document.body.style.zoom = "2"));
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    "200% CSS zoom",
  );
  await page.evaluate(() => (document.body.style.zoom = ""));
  const projectId = await page.evaluate(
    () => JSON.parse(localStorage.getItem("clientbrief-v1")).projects[0].id,
  );
  const printPage = await context.newPage();
  await printPage.goto(
    `${base}/print/?project=${encodeURIComponent(projectId)}`,
  );
  await printPage
    .getByRole("heading", { name: "Studio website redesign", exact: true })
    .waitFor();
  await printPage.emulateMedia({ media: "print" });
  assert.equal(await printPage.locator(".print-controls").isVisible(), false);
  await printPage.pdf({
    path: "artifacts/approved-brief.pdf",
    format: "A4",
    margin: { top: "16mm", bottom: "16mm", left: "16mm", right: "16mm" },
  });
  await printPage.close();
  await click("All projects");
  await page.getByLabel("Search projects").fill("no such project");
  await page.getByRole("heading", { name: "No matching projects" }).waitFor();
  await click("Clear filters");
  await page.screenshot({
    path: "artifacts/project-library-dark.png",
    fullPage: true,
  });
  await page.goto(`${base}/popup/`);
  await page.getByRole("button", { name: "Open dashboard" }).waitFor();
  await page.setViewportSize({ width: 360, height: 600 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.screenshot({ path: "artifacts/popup-dark.png", fullPage: true });
  await page.goto(base);
  await page.evaluate(() =>
    localStorage.setItem("clientbrief-v1", "{unreadable"),
  );
  await page.reload();
  await page
    .getByRole("heading", { name: "Workspace could not be loaded" })
    .waitFor();
  const recoveryDownload = page.waitForEvent("download");
  await click("Export recovery data");
  const recovery = await recoveryDownload;
  assert.equal(await readFile(await recovery.path(), "utf8"), "{unreadable");
  await click("Reset unreadable workspace");
  await confirm("Reset workspace");
  await page
    .getByRole("button", { name: "Create your first project" })
    .waitFor();
  assert.deepEqual(errors, [], "No runtime or CSP errors");
  assert.deepEqual(network, [], "No external requests");
  console.log(
    "PASS: local workflow, evidence/baselines, exports, dialogs and keyboard access, draft recovery, deduplication, questions, milestones, validated restore, cross-window edit conflicts, import/redaction, archive/search, local fonts, both themes and responsive layouts.",
  );
} catch (error) {
  await page?.screenshot({ path: "artifacts/ui-failure.png", fullPage: true });
  console.error(await page?.locator("body").innerText());
  throw error;
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
