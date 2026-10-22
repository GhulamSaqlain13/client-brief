# ClientBrief AI — Chrome Extension Functional Specification

## 1. Product overview
ClientBrief AI converts freelancer–client conversations into structured, versioned project briefs. It supports manually selected text, pasted conversations, and user-authorized imports. It is a requirements-management assistant, not an automatic messaging bot.

**Primary users:** Fiverr, Upwork, Freelancer.com and independent freelancers, small agencies, project managers.

**Core promise:** Understand what was agreed, what is missing, and what changed—without rereading long threads.

## 2. Main user journeys
1. Freelancer opens a client conversation, selects relevant messages and clicks **Add to ClientBrief** from the context menu or extension side panel.
2. Extension previews captured content, source, client/project association and privacy notice; user confirms.
3. AI produces a structured brief with evidence-linked requirements and confidence indicators.
4. Freelancer reviews, edits and approves the brief before treating it as the baseline.
5. New messages are added later; the system compares them against the approved baseline and highlights changes, contradictions and decisions requiring confirmation.
6. Freelancer generates client questions, a statement of work or a shareable/exportable summary.

## 3. Complete functional requirements

### A. Onboarding and accounts
- Guest/local-only mode for trial use.
- Optional email/password or OAuth login for cross-device sync.
- Explain permissions and data handling before capture.
- Configure profession, timezone, currency, language and preferred brief template.
- Provide onboarding with sample conversations and a guided first brief.
- Workspace support for solo freelancers and optional teams.

### B. Conversation capture
- Capture user-highlighted text via context-menu action.
- Paste raw chat text into the side panel.
- Import user-provided `.txt`, `.md`, `.csv`, or text-based `.pdf` where supported.
- Optional Gmail integration through user-authorized official APIs, subject to scopes and verification; no silent inbox scanning.
- Show capture preview before saving, with ability to remove irrelevant/sensitive messages.
- Attach source URL, source platform, capture timestamp, author/speaker if known, and message timestamps if available.
- Let user correct sender roles and message order.
- Deduplicate repeated captures using source IDs when available or text hashes.
- Handle large threads through chunking, progress indication and resumable processing.
- Treat website content as untrusted; never execute instructions embedded in client messages.
- Never auto-send messages, scrape in the background, or bypass marketplace restrictions.

### C. Client and project management
- Create, rename, archive, delete and search clients/projects.
- Associate multiple threads and sources with one project.
- Record client name/alias, platform, project title, project status, budget, currency, start date and deadline.
- Maintain multiple briefs for a client without mixing projects.
- Add tags, project notes, and custom fields.
- Project dashboard: new, clarifications needed, approved, in progress, completed, archived.

### D. AI requirement extraction
- Extract objective, business context, audience and success criteria.
- Extract in-scope deliverables, out-of-scope items, feature requirements, integrations, assets and dependencies.
- Detect budget, payment milestones, deadline, revisions, acceptance criteria and ownership/IP terms only when explicitly mentioned.
- Extract technical constraints (frameworks, hosting, APIs, platforms, accessibility, security, localization).
- Identify decisions, assumptions, open questions, risks and client-provided materials.
- Distinguish **confirmed**, **proposed**, **ambiguous**, **contradicted** and **not mentioned**.
- Link each extracted item to its supporting source snippet and capture timestamp.
- Do not fabricate missing details; use `unknown` when evidence is absent.
- Provide confidence labels and manual override.
- Allow profession-specific templates (web development, design, SEO, video, copywriting, marketing).
- Allow regenerate-by-section rather than rewriting approved fields.

### E. Brief editor and approval
- Structured sections with inline editing, add/remove/reorder and rich-text notes.
- Requirement IDs, priority (must/should/could), status and owner.
- Review queue for AI-extracted items before adding them to the canonical brief.
- Save draft and explicitly mark a version as **approved baseline**.
- Manual lock for approved requirements; changes create proposals, not silent overwrites.
- Show who approved, when and from which evidence.
- Autosave local drafts with conflict handling.

### F. Change detection and contradiction analysis
- Compare new captures to the latest approved baseline.
- Classify: new feature, scope expansion, scope reduction, deadline change, budget change, clarification, contradiction, duplicate or unrelated.
- Display before/after values, cited evidence and potential impact.
- Highlight disagreements between messages, including newer statements that conflict with older ones.
- Keep uncertain classifications in a human-review queue.
- Accept/reject/merge change suggestions individually.
- Maintain a chronological change log with author, timestamp and reason.
- Offer optional effort-impact notes; never invent price estimates without user input.

### G. Missing information and questions
- Checklist of unanswered questions by category (scope, access, content, design, integrations, payment, timeline, approvals).
- Rank questions by delivery risk and dependency.
- Generate clear, polite clarification messages in concise or detailed tone.
- Provide copy-to-clipboard; user sends manually through the platform.
- Mark questions as asked, answered, blocked or no longer needed.
- Connect answers back to requirements with source references.

### H. Deliverables and milestones
- Generate editable deliverables and milestone breakdown from confirmed scope.
- Track due dates, dependencies, status and acceptance criteria.
- Optional integration/export to task tools in a later phase.
- Flag milestones whose prerequisites remain unresolved.

### I. Search, navigation and reporting
- Search across clients, projects, requirements, sources and decisions.
- Filter by platform, status, priority, date and missing information.
- Project overview: confirmed requirements, unresolved questions, proposed changes, upcoming milestones.
- Export approved brief to Markdown, PDF and JSON; optionally CSV requirements table.
- Copy client-facing scope summary or statement-of-work draft.
- Include export timestamp and version number; optional evidence appendix.
- Share via explicit invite or expiring read-only link in paid/cloud mode; no public sharing by default.

### J. Notifications and integrations
- Notify about unresolved high-priority questions and pending scope reviews (opt-in).
- Chrome notifications for reminders only with permission.
- Optional integration with PromiseTracker via an explicit shared-project API/event model.
- No unsupported promises of real-time platform message synchronization.

### K. Settings, privacy and security
- Minimum necessary Chrome permissions: `storage`, `contextMenus`, `sidePanel`; request `activeTab` or narrowly scoped host permissions only when needed; `notifications` optional.
- Encrypt data in transit; protect stored secrets; keep API keys server-side if using hosted AI.
- Data minimization, redaction options for emails/phones/credentials, configurable retention and deletion.
- Consent before transmitting conversation text to any AI provider; disclose provider and retention policy.
- Workspace isolation, authorization checks and audit trail for shared projects.
- Export all user data and permanently delete account/project data.
- Rate limits, error handling, retry with backoff, quota indicators and offline-safe draft storage.
- Follow Chrome Web Store policies and each marketplace's terms; no credential harvesting or unauthorized scraping.

## 4. Chrome extension interface
- **Toolbar popup:** current project, capture selection, latest unresolved items, open dashboard.
- **Side panel:** capture preview, brief tabs, questions, changes, source evidence.
- **Context menu:** “Add selection to ClientBrief AI.”
- **Full dashboard:** clients/projects, brief editor, version history, exports and settings.
- **Optional page action:** user-triggered “Capture selected messages” on supported sites; no invasive overlays by default.

## 5. Suggested data model
- `users(id, email, timezone, preferences)`
- `workspaces(id, owner_id, name)`
- `clients(id, workspace_id, display_name, platform)`
- `projects(id, client_id, title, status, currency, budget, deadline)`
- `sources(id, project_id, platform, url, captured_at, content_hash)`
- `messages(id, source_id, speaker, sent_at, text, source_locator)`
- `brief_versions(id, project_id, version, status, approved_at, approved_by)`
- `requirements(id, brief_version_id, category, description, priority, state)`
- `evidence_links(id, requirement_id, message_id, excerpt)`
- `questions(id, project_id, text, status, priority)`
- `change_proposals(id, project_id, baseline_version_id, category, before_json, after_json, review_status)`
- `milestones(id, project_id, title, due_at, status, acceptance_criteria)`
- `audit_events(id, project_id, actor_id, action, created_at)`

## 6. AI processing architecture
1. Client-side capture and sanitization; explicit user confirmation.
2. Backend ingestion validates ownership, normalizes content, and chunks long threads.
3. LLM returns schema-validated JSON with extracted fields and message references.
4. Deterministic validators check dates, amounts, source IDs and duplicates.
5. Review screen shows evidence and uncertainty; no automatic baseline approval.
6. Later captures run a semantic diff against the approved brief; proposals await review.

**Suggested stack:** TypeScript, React, Vite/Plasmo or WXT, Chrome Manifest V3, Node.js API, PostgreSQL/Supabase or MongoDB, server-side LLM integration, and optional queue worker. Local-first MVP can use IndexedDB plus optional backend AI.

## 7. MVP (first release)
- Manual text selection and paste.
- Client/project CRUD.
- AI extraction into 6 sections: overview, requirements, deliverables, timeline, budget, questions.
- Evidence links and manual edits.
- Approved baseline + new-message comparison.
- Markdown/PDF export.
- Privacy settings and deletion.

**Not MVP:** automated marketplace inbox sync, team collaboration, billing, advanced integrations, mobile app.

## 8. Acceptance criteria
- User can create a project and process a pasted conversation without platform access.
- Every AI-derived confirmed requirement has a source reference or is marked as manually entered.
- Missing budget or deadline remains unknown, never guessed.
- New contradictory messages appear as reviewable proposals without changing approved scope.
- User can export an accurate, version-labeled brief.
- Duplicate captures do not duplicate requirements without warning.
- User can remove a capture and delete the project data.
- Failed AI requests preserve user input and provide actionable retry.

## 9. Monetization hypothesis
- Free: limited projects and AI analyses, local manual capture.
- Pro: larger threads, more projects, version history and advanced exports.
- Team: shared workspaces, approvals, audit logs.

Validate willingness to pay through interviews and a landing-page waitlist before setting prices.

## 10. Success metrics
- First-brief completion rate; time to first usable brief.
- Percentage of extracted items accepted/edited/rejected.
- Questions resolved before project start.
- Number of scope changes reviewed and approved.
- Weekly active projects, retention and paid conversion.
