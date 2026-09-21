# Corporate Hallmark evidence record

**Recorded:** 2026-09-21  
**Scope:** Reconciliation record for plan 31, not a substitute for the original Hallmark research-session artifacts.

## Confirmed repository evidence

- `templates/corporate/theme.ts` validates the committed `TemplateTheme` at module scope through `assertValidTheme`. Its direction is Structured Grid / Editorial Ledger, using Plus Jakarta Sans, Be Vietnam Pro, deep lapis and warm brass.
- `templates/corporate/app/globals.css` defines the referenced color, type, spacing and motion tokens. It includes a reduced-motion override, `overflow-x: clip` at the root, and responsive `minmax(0, 1fr)` grid tracks.
- `templates/corporate/app/page.tsx` composes the static shell in the required order: `Hero`, `CallbackSection`, services `ItemGrid`, leadership `PeopleGrid`, then `Footer`.
- `templates/corporate/app/CallbackSection.tsx` uses `useLocalCollection` with the documented `corporate-callback-requests` key and an empty seed. `CallbackSection.test.tsx` covers empty state, submission and remount persistence.
- The implementation commits are `fb5e411`, `b3c2a82`, and `5ec7d84`; plan completion and the filled score table are committed in `a941d3d`.

## Documented claims, not independently reproducible from this tree

- The plan records Hallmark research, WCAG AA verification, viewport checks, and a Hallmark audit with all ten criteria scored at least 9/10.
- No separate moodboard, contrast-calculation output, viewport capture, or raw Hallmark audit artifact is present in the current repository. Therefore this record preserves the code-level evidence and explicitly does not re-assert those process results as newly verified.

## Verification boundary

This reconciliation was read-only. It did not rerun Vitest or `npm run build`; the plan's historical pass claims remain documented claims until a fresh runtime verification is requested.
