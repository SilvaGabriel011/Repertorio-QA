# 09 — Accessibility Testing

> WCAG 2.1 A/AA as an automated gate on every meaningful screen — plus an honest account of what automation cannot see.
>
> **Where:** `tests/a11y` · **Tool:** axe-core via Playwright · **Run:** `npm run test:a11y` · **Risk:** R8 (the UI excludes users)

## 1. Before — design

Accessibility is a functional requirement — "can everyone use it?" is not softer than "can anyone use it?". The scope is defined by state, not by page: the app has three meaningful views (login, catalog, checkout), so the suite scans three states, each reached through real user actions, not by URL-poking a half-rendered DOM.

Standard chosen up front: **WCAG 2.1 Level A + AA** (`wcag2a`, `wcag2aa` tags) — the level most legal and contractual obligations reference. Setting the bar before scanning is the point; "whatever axe flags today" is not a standard.

The app was *built* to pass, which is the honest lesson: accessibility is a design input, not a test output. Labelled inputs, `role="alert"` on the error region, `aria-label` on icon-only quantity buttons, real focusable `<button>`s. The test guards those decisions; it did not make them.

## 2. During — execution

Runs in CI gate 2 on every change, sharing the Playwright fixtures (`signedIn`, page objects) with the functional suites — the same navigation code reaches each state, so a11y coverage tracks the real UI for free instead of drifting from it. Each scan runs against the fully rendered, interacted-with DOM (checkout is scanned *after* an item is added and the view is open), because a11y bugs hide in real states, not initial ones.

A violation fails the build with the specific rule, the offending nodes, and a fix URL — the report is the remediation ticket.

## 3. After — analysis

- **Exit criterion:** zero violations at A/AA on all three states.
- **The honest caveat, stated loudly:** automated scanning catches perhaps 30–40% of WCAG issues — the machine-decidable ones (contrast, labels, roles, ARIA validity). It **cannot** judge whether alt text is *meaningful*, whether focus order is *logical*, whether the experience is coherent to a screen-reader user. A green axe run means "no automated violations", never "accessible".
- **Maintenance rule:** the automated gate is paired, in a real org, with periodic manual audits — keyboard-only walkthroughs and actual assistive-technology testing. This suite is the regression net; humans own the judgment calls the net cannot make.

## How it is applied here

| Decision | Where to see it |
| --- | --- |
| Three states scanned, each reached via real actions | `tests/a11y/wcag.a11y.spec.ts` |
| Standard pinned to WCAG 2.1 A/AA | `.withTags(['wcag2a', 'wcag2aa'])` |
| Checkout scanned in its true state (item added, view open) | same spec |
| Accessible affordances baked into the app | `src/api/public/index.html` — labels, `role="alert"`, `aria-label`s |

## Field notes

- "No automated violations" and "accessible" are different claims. Conflating them is how teams ship a technically-conformant page that a screen-reader user still cannot check out on.
- Build for it, then test for it. Retrofitting accessibility onto a finished UI is remediation; designing for it makes this suite a quiet formality — which is exactly what a healthy a11y suite should be.
- Icon-only controls (the ± steppers) are the classic trap: they look fine, and they are invisible to assistive tech without a label. Test the things sighted review skips.
