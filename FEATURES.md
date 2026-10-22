# ClientBrief implementation checklist

This checklist maps the functional specification to the local extension. Complete means implemented in code, not a claim of Chrome Web Store approval. The separate cloud/AI features are deliberately unavailable.

## Local workflow
- [x] Next.js static export, Manifest V3, popup, side panel, selected-text context menu.
- [x] Local guest workspace with minimum permissions and no automatic message sending.
- [x] Project create, edit, delete, archive/unarchive, status, notes, tags.
- [x] Client grouping from project records; reuse a client name across isolated projects.
- [x] Project library search across scope/source text, platform/status/archive filters, sorting and pagination.
- [x] Editable capture preview and explicit confirmation before canonical capture storage.
- [x] TXT/Markdown/raw-CSV imports, size validation, common-pattern redaction.
- [x] Source URL/timestamp, exact evidence excerpts, capture hash deduplication.
- [x] Local keyword organization into six sections, clearly labeled as non-AI.
- [x] Manual brief item add/edit/remove, priority, owner, evidence state, draft reordering.
- [x] Explicit baseline approval, source validation, immutable snapshots, version history.
- [x] New captures and approved-item edits/removals become reviewable proposals.
- [x] Human change classification, accept/reject/section replacement, review reason/time.
- [x] Questions with open/asked/answered/blocked/not-needed status and copyable clarification text.
- [x] Manual milestones, due date, status, acceptance criteria, prerequisite checks and cycle validation.
- [x] Approved Markdown, JSON, CSV and print-to-PDF exports with version/time labels.
- [x] Full workspace backup and validated, explicitly confirmed replacement restore.
- [x] Capture/project/all-data deletion, including evidence copies in affected history/proposals.
- [x] Capture draft autosave, storage errors, cross-window updates, browser write locks and revision checks.
- [x] Readable locally bundled Inter font; semantic palette; saved light/dark/system appearance.
- [x] Native accessible dialogs, focus restoration, Escape handling, keyboard tabs, reduced-motion support.

## Pending integrations and wider specification
- [ ] Hosted LLM extraction, schema-validated model responses, semantic contradiction/diff engine. User selected **choose later; keep processing local**.
- [ ] Separate authenticated AI backend, provider consent and retention disclosures, quotas and retry policy.
- [ ] Accounts, workspace authorization, team approvals/audit attribution, device sync, cloud sharing.
- [ ] Standalone client records with independent client CRUD; currently grouped by project client name.
- [ ] Profession/template onboarding and configurable workspace timezone/currency/language.
- [ ] Speaker/message timestamp parsing and ordering controls; captures currently use raw text lines.
- [ ] PDF import, large-thread chunking/resume beyond the explicit 100,000-character capture limit.
- [ ] Question answers linked as separate evidence records, rich-text brief notes, custom fields.
- [ ] Retention scheduling, encrypted local vault, full credential detection beyond common patterns.
- [ ] Notifications, Gmail/PromiseTracker/task-tool integrations, billing and mobile.
- [ ] Installed Chrome API acceptance checks and Chrome Web Store release review.

No remote processing, authentication, encryption, semantic analysis, marketplace synchronization or automatic message sending is represented as working.
