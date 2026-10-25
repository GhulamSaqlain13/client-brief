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
- [x] Local keyword organization into seven sections (six spec sections plus "Not included"), clearly labeled as non-AI.
- [x] Manual brief item add/edit/remove, priority, owner, evidence state, draft reordering.
- [x] Explicit baseline approval, source validation, immutable snapshots, version history.
- [x] New captures and approved-item edits/removals become reviewable proposals.
- [x] Human change classification, accept/reject/section replacement, review reason/time.
- [x] Questions with open/asked/answered/blocked/not-needed status and copyable clarification text.
- [x] Change orders on new-feature/scope-expansion proposals: user-entered price/currency/extra days, concise or detailed client message to copy, status (draft/sent/accepted/declined). Never estimated or sent automatically.
- [x] Revision tracking: agreed revision limit with evidence or manual label, revision log per deliverable, counted/not-counted, beyond-limit flags and extra-revision requests. Unknown limit stays unknown.
- [x] Manual milestones, due date, status, acceptance criteria, prerequisite checks and cycle validation.
- [x] Approved Markdown, JSON, CSV and print-to-PDF exports with version/time labels.
- [x] Full workspace backup and validated, explicitly confirmed replacement restore.
- [x] Capture/project/all-data deletion, including evidence copies in affected history/proposals.
- [x] Capture draft autosave, storage errors, cross-window updates, browser write locks and revision checks.
- [x] Readable locally bundled Inter font; semantic palette; saved light/dark/system appearance.
- [x] Native accessible dialogs, focus restoration, Escape handling, keyboard tabs, reduced-motion support.

- [x] Client-confirmable scope summary from the approved version; client reply recorded as a quoted, source-linked confirmation per version.
- [x] Profession templates (general, web, design, SEO, video, copywriting, marketing): starter checklist, suggested questions and common exclusions, all added only on request.
- [x] Readiness checklist (missing/received/not needed) with readiness % on project cards and the project header.
- [x] Speaker and timestamp parsing for "Name: message", "[time] Name: message", "Name (time): message" and WhatsApp-style lines; role correction and sort-by-time in capture preview.
- [x] Attention panel: overdue and due-this-week milestones/payments, questions unanswered after N days (setting), pending reviews. Popup shows the count. Opt-in browser reminders via optional notifications/alarms permissions.
- [x] Standalone client records: create, rename (renames projects), delete when unused, notes, and per-client history (scope additions, revisions, accepted change orders, overdue payments).
- [x] Payment tracker: stated amounts with evidence (amount must appear in the quote) or manual label; paid/due/overdue and totals per currency.
- [x] Rule-based change hints: budget/date differences, requests overlapping "Not included" items, duplicates and new scope pre-select a classification. Labeled as rules, not AI.
- [x] Text-based PDF import (pdf.js, on-device) and threads up to 1,000,000 characters saved as linked 100,000-character parts, resumable from the draft.

## Pending integrations and wider specification
- [ ] Hosted LLM extraction, schema-validated model responses, semantic contradiction/diff engine (local rule-based hints exist). User selected **choose later; keep processing local**.
- [ ] Separate authenticated AI backend, provider consent and retention disclosures, quotas and retry policy.
- [ ] Accounts, workspace authorization, team approvals/audit attribution, device sync, cloud sharing.
- [ ] Guided onboarding with sample conversations; workspace timezone/currency/language settings.
- [ ] OCR for scanned PDFs; background processing for very large threads.
- [ ] Question answers linked as separate evidence records, rich-text brief notes, custom fields.
- [ ] Retention scheduling, encrypted local vault, full credential detection beyond common patterns.
- [ ] Gmail/PromiseTracker/task-tool integrations, billing and mobile.
- [ ] Installed Chrome API acceptance checks and Chrome Web Store release review.

No remote processing, authentication, encryption, semantic analysis, marketplace synchronization or automatic message sending is represented as working.
