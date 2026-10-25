# Project memory

Updated: 2026-10-25

## Product and authority
- ClientBrief AI: local-first Chrome extension for source-linked freelancer project briefs and approved scope history.
- Product source: ClientBrief_AI_Extension_Spec.md. Actual implemented/pending checklist: FEATURES.md.
- Read CLAUDE.md, this file, and HANDOFF.md at session start. Keep notes current so the user need not repeat context.

## Explicit user decisions and preferences
- User chose Next.js for the extension.
- User wants professional, modern, smooth UI, readable text, both light and dark themes, and icons rather than emojis.
- User supplied a senior-engineer/designer implementation brief and requested direct repository work, no generic replacement template.
- During the latest implementation pass the user selected: Choose later; keep processing local. No hosted AI provider should be connected without a later request.

## Architecture
- Next.js Pages Router, React, TypeScript, output: export, Chrome Manifest V3.
- Public manifest/worker under public/. scripts/package-extension.mjs externalizes executable inline scripts for MV3 CSP. Load generated out/ as unpacked extension.
- Only storage, contextMenus and sidePanel permissions; no host permissions, background scraping or content scripts.
- chrome.storage.local inside extension; localStorage in web development; separate stores.
- lib/storage.ts uses Web Locks and revision checks. hooks/useWorkspace.ts validates loads/events and rejects stale editor snapshots. Requires extension/localhost/HTTPS secure context.
- lib/validation.ts validates nested backup/store fields, states, IDs, evidence references, version ordering, dates and milestone dependency cycles.
- Captured text is rendered as text. The offline organizer is keyword-based, not an LLM or semantic contradiction engine.

## Implemented local flows
- Project library with cross-scope/source search, active/archived/all, platform/status filters, sort and pagination.
- Create/edit/archive/delete projects, status/notes/tags; grouped client view with reusable client names. Independent client records are not implemented.
- Popup, side panel layout, selected-text context menu, pending capture preview.
- Paste and TXT/Markdown/raw CSV imports, common-pattern redaction, explicit confirmation, SHA-256 deduplication, exact source snippets.
- Capture draft text autosaves at 800 ms; saves are serialized; errors preserve editor input.
- Six-section briefs, manual add/edit/remove, priority, owner, evidence state, draft reordering, visible IDs.
- Explicit approval with valid evidence and resolved states; immutable version snapshots. Removing all scope can produce an empty subsequent baseline.
- Later captures and approved-item edits/removals become proposals. Human classification, accept/reject/section replacement, review reason/timestamp.
- Questions: open/asked/answered/blocked/not-needed status, copyable client clarification message. User sends manually.
- 2026-10-25 (user request, suggestions #1/#2/#4): `exclusions` section; Proposal.changeOrder and Revision.changeOrder (user-entered amount/currency/extraDays/message/status, validated by checkChangeOrder); Project.revisionPolicy and revisions with evidence via checkEvidence; Revisions tab. Revision data is live metadata, not versioned scope; exports label it so. Removing a capture drops revisions/policy linked to it.
- Milestones: manual date/status/acceptance/prerequisite editing, prerequisite flags, cycle validation.
- Approved Markdown/JSON/CSV exports; CSV formula escaping; formatted print/PDF document and evidence appendix.
- Full workspace backup, nested runtime validation, preview and explicit replacement restore.
- Capture deletion removes linked items, related proposal copies, affected whole historical versions and the project's capture draft. Version sequence does not reset after history deletion.
- Project/all-data deletion uses confirmation. Exported backup files are outside deletion scope.
- Unreadable storage can be exported as raw recovery data, then explicitly reset. Valid storage is never silently reset.

## Design system
- Bundled Inter Variable via @fontsource-variable/inter, including package font license. No remote font calls.
- 2026-10-25: User asked to match `ClientBrief AI — Projects redesign.html` and use its palette. Tokens in globals.css follow it (indigo #5A52C7, deep navy #1E1B4B card, green/amber semantics); dark variant derived. redesign.css loaded last; illustrations in components/Illustrations.tsx use il-* token classes.
- Projects library: hero with New project / Import transcript (creates a project, then opens capture), icon stat cards, labeled filters, illustrated empty state + How it works, sidebar Getting started card (hidden once all 3 real steps are done).
- Shared colors in styles/globals.css; interactions in theme.css; typography.css and workspace.css handle readable type/layout.
- 15px body, 14px controls, 12-13px metadata, 28-32px page headings; native dialogs and Lucide icons.
- Persistent System/Light/Dark via localStorage clientbrief-theme, cross-page storage events and same-window custom events; CSP-safe prepaint theme script.
- Native modal focus/Escape handling, arrow/Home/End tabs, compact client/project navigation, reduced-motion styling. Paper output is light.

## Freelancer-pain features (2026-10-25, user asked to implement the whole suggestion list)
- Implemented locally: change orders, revision counter, client summary + confirmations, Not included section, templates + checklist, speaker parsing, attention panel + opt-in reminders, client records, payments, rule-based change hints, PDF import + multi-part threads.
- Hosted LLM (#11) deliberately NOT connected: user's earlier decision "choose later; keep processing local" stands. Only deterministic hints in lib/compare.ts.
- Code: lib/conversation.ts (parsing/splitting), lib/compare.ts (hints), lib/planning.ts (checklist, payments, summary, attention, clients), lib/templates.ts, lib/pdf.ts, lib/reminders.ts. Store gained clients/settings; Project gained template/checklist/payments/confirmations.
- Manifest: optional_permissions notifications+alarms (requested from Settings only); icons in public/icon-*.png. pdf.js worker is copied to public/pdf.worker.min.js by predev/prebuild (gitignored).
- Payment amounts with evidence must appear in the quoted words. Confirmations require a quoted capture. Removing a capture drops linked payments/confirmations/revisions.

## Deliberately pending
- Remote AI/backend/authentication/quotas/consent policy, semantic contradiction analysis, teams/cloud sync/sharing, billing, advanced integrations.
- Guided sample onboarding, timezone/currency settings, OCR for scanned PDFs, rich-text editing, full question-answer evidence links, retention scheduling, encryption.
- Redaction covers common patterns only. Local storage is not an encrypted vault. One capture: 100,000 characters (threads up to 1,000,000 are split); backup import: 10 MB.
- Installed Chrome popup/side-panel/context-menu APIs need manual acceptance checks. Browser tests run the exported UI under its script CSP, not an installed extension.

## Commands and environment
- npm run dev, npm run lint, npm run typecheck, npm test, npm run build, npm run test:ui, npm run format.
- Edge is installed and used by browser smoke tests; artifacts/ receives screenshots and a sample approved PDF from synthetic test data.
- Node 22.18.0/npm 11.19.0 available at initial setup. Network dependency installation required sandbox escalation; .npm-cache is workspace-local and ignored.
- Development previously ran on localhost:3001; port 3000 served another app. Do not stop unrelated processes or assume the port; read Next's terminal URL.
- Prior hydration errors referenced obsolete P/WORKSPACE markup during UI edits; fresh localhost:3001 loads passed. If reported again, inspect current logs and reproduce before changing source.

## Repository delivery (2026-10-22)
- User authorized pushing this project to https://github.com/GhulamSaqlain13/client-brief.
- Git remote origin points to that repository, default working branch main. Use normal non-force pushes and verify remote HEAD after publishing.
- Source, dependency lockfile, tests, project documentation and persistent context belong in Git. Generated out/, .next/, node_modules/, .npm-cache/, artifacts/, logs and environment secrets are ignored.
