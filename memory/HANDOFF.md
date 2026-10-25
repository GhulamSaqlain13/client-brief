# Session handoff

Updated: 2026-10-25

## Current task and status
Implemented the full freelancer feature list (#1-#10, #12, and the local rule-based part of #11). Done and verified; nothing committed yet (redesign work is also uncommitted).

## Not done, by decision
- #11 hosted LLM extraction: blocked on the user's recorded choice to keep processing local and pick a provider later.

## Verification
- npm run lint, typecheck, test (21 pass), build: passed.
- npm run test:ui: PASS, now also covering change orders, revisions, client summary, checklist, payments, PDF import under CSP, speaker detection, attention panel and clients view. Screenshots in artifacts/ were reviewed.
- Not verified: opt-in reminders (chrome.permissions/alarms/notifications) need a manual check in installed Chrome.

## Next steps
1. Reload the unpacked extension from out/; in Settings enable reminders and confirm the permission prompt and a notification.
2. Commit when the user asks.
