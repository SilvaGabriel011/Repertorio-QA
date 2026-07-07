# BUG-2026-004 — Quantity steppers have no accessible name

| Field | Value |
| --- | --- |
| **Status** | ✅ Fixed & Verified |
| **Severity** | Medium (blocks screen-reader users on a core flow) |
| **Priority** | High |
| **Component** | `src/api/public/index.html`, `app.js` (cart rendering) |
| **Found in** | Cycle 41 · accessibility scan (WCAG 2.1 AA) |
| **Fixed in** | build 1.4.0-rc.2 |
| **Reported by** | G. Silva (QA) |

## WCAG reference
**4.1.2 Name, Role, Value (Level A)** — UI components must expose an accessible name.

## Steps to reproduce
1. Sign in and add any product to the cart
2. Inspect the `+` / `−` quantity buttons with a screen reader or axe-core

## Expected
Each control announces what it does, e.g. *"Increase quantity of QA Mug"*.

## Actual
The buttons rendered only the glyphs `+` / `−` with no `aria-label`. A screen reader announced *"button"* with no context — a user cannot tell increase from decrease, or which product they act on.

## Fix & verification
- Added `aria-label` to each stepper and to the remove control, interpolating the product name (`app.js`).
- **Regression:** the automated axe-core scan of the catalog and checkout states (`tests/a11y/wcag.a11y.spec.ts`) now asserts zero violations at A/AA and would fail if the labels regressed.
- Verified with the axe scan and a manual keyboard + screen-reader pass.

## Notes
Icon-only controls are the classic automation-catchable a11y defect — invisible to sighted review, caught instantly by a scan. It is also the honest limit of automation: the scan proves a name *exists*; a human still confirmed the name is *meaningful* (see [docs/09](../../docs/09-accessibility-testing.md)).
