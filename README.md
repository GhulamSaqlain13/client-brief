# ClientBrief AI

A local-first Chrome extension for turning client conversations into source-linked project briefs. Built with Next.js Pages Router, React, TypeScript and Chrome Manifest V3.

## Run locally

Requires Node.js 22+ and npm.

```sh
npm install
npm run dev
```

Open the URL printed in the terminal. Next defaults to http://localhost:3000 and selects another port if it is occupied. During recent development this project ran at http://localhost:3001.

The web preview uses localStorage. The installed extension uses chrome.storage.local. Those are separate workspaces. Export/restore a JSON backup to transfer data between them. Use localhost or HTTPS for browser storage locks and clipboard support.

## Build and install the extension

```sh
npm run build
```

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Choose **Load unpacked** and select this project's `out` directory.
3. Pin ClientBrief, then use the toolbar popup to open the dashboard or side panel.
4. Create a project. Select relevant conversation text on a normal web page, right-click **Add selection to ClientBrief AI**, and confirm the preview in the project.

After changes, rebuild, reload the extension card and refresh any open extension pages. Load `out`, not the repository root or `.next`. Browser-controlled pages may restrict extension access; paste text into the dashboard when selection capture is unavailable.

## Working with a project

- **Project library:** search project names, clients, captured text, requirements, tags and notes. Filter by archive state, platform or status; sort and page through results.
- **Clients:** browse names grouped from project records. Reusing a client name keeps their projects together without mixing their briefs.
- **Capture:** paste or import TXT, Markdown or raw CSV text. Review and edit it, optionally redact common sensitive patterns, then confirm. Draft text autosaves after 800 ms of inactivity. Exact duplicates are rejected using normalized SHA-256 hashes.
- **Brief:** review six sections, inspect evidence, add/edit/remove items, set priority/owner/evidence state, and reorder draft items.
- **Approval:** explicitly approve a baseline. Every extracted item must have valid evidence. Ambiguous or contradicted items need resolution. Approved versions remain immutable.
- **Changes:** later captures and edits/removals become proposals. Classify them, add a review reason, then accept, reject or replace a section. Accepted proposals change the working draft; approve a new baseline to commit scope.
- **Questions:** track open, asked, answered, blocked and no-longer-needed questions. Copy a clarification message and send it manually through your normal client channel.
- **Milestones:** manually plan due dates, status, acceptance criteria and prerequisites. Unfinished dependencies are flagged and cycles are rejected.
- **Export:** download the latest approved version as Markdown, JSON or a spreadsheet-safe CSV. Print a formatted brief with its evidence appendix or save it as PDF using the browser print dialog.
- **Settings:** choose light/dark/system appearance; export the full workspace; validate and preview a backup before explicitly replacing local data.

Capture deletion removes linked items, related proposals, affected historical versions and the project's capture draft. Exported backup files are not deleted. Project/workspace deletion also requires explicit confirmation.

## Design and accessibility

Inter is bundled locally under its included open font license; there are no external font requests. The design uses restrained indigo accents, neutral light/slate surfaces, semantic status colors, consistent 40px controls, and Lucide line icons. Text uses a shared 12–15px UI scale with 28–32px page headings.

Dialogs use the browser's native modal focus management, support Escape and restore focus to the previous control. Project tabs support arrow keys, Home and End. Narrow layouts keep project/client navigation available, and reduced-motion preferences are respected. Paper exports always use light colors.

## Quality checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:ui
```

`test:ui` requires installed Microsoft Edge and a fresh build. It serves the exported files with the MV3 script CSP, exercises the local workflow, checks both appearances and responsive layouts, and writes screenshots/PDF artifacts under `artifacts/`. It does not replace manual testing of actual installed-Chrome APIs. `npm run format` formats the source.

## Architecture

- `pages/`: project dashboard, toolbar popup, print document and shared entry points.
- `components/`: accessible dialogs and reusable project/capture/brief/review/settings views.
- `hooks/useWorkspace.ts`: validated state, cross-window updates, save errors and stale-editor protection.
- `lib/model.ts`: capture organization, scope/version rules, proposal review, deletion and exports.
- `lib/validation.ts`: runtime checks for saved data and backups, evidence references, unique IDs and milestone dependencies.
- `lib/storage.ts`: extension/web adapters, browser write locks, revision checks and explicit corrupt-data recovery.
- `styles/`: semantic color tokens, typography and workspace components.
- `public/`: manifest, background worker and packaged theme initialization.
- `scripts/package-extension.mjs`: externalizes executable inline Next scripts for MV3 CSP.

The extension requests only `storage`, `contextMenus` and `sidePanel`. It has no host permissions, content scripts, analytics or automatic scraping. Captured content is rendered as text and never executed.

## Integration status and limits

The user chose **keep processing local; choose the AI provider later**. The organizer uses keyword rules, not an LLM. It does not infer semantic contradictions, invent missing dates/budgets, or estimate prices. Every incoming item needs human review.

There is no remote AI backend, account system, cloud sync, team workspace or hosted sharing. A future integration needs a separate authenticated backend, validated model output, explicit consent and provider/retention disclosures. Next API routes cannot run inside a static extension; never embed provider keys in its bundle.

Current captures split by line rather than parsing message speakers. CSV import treats file content as raw conversation text. PDF import, independent client records, rich-text notes, retention scheduling and full question-answer evidence linking remain pending. Redaction catches common patterns, not every possible secret. Local data is not an encrypted vault. A capture is limited to 100,000 characters; backup imports are limited to 10 MB.

See [FEATURES.md](FEATURES.md) for the complete implementation checklist. Read `CLAUDE.md`, `AGENTS.md` and `memory/` before continuing development.
