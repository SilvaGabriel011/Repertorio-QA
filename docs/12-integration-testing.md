# 12 — Integration Testing

> Components collaborating in-process: routes → store → domain, and the state that must survive across requests. The layer between isolated units and the black-box API.
>
> **Where:** `tests/integration` · **Tool:** supertest + Vitest · **Run:** `npm run test:integration` · **Risks:** R1, R2, R6 (wiring & state)

## 1. Before — design

Unit tests prove each part is right alone; the API suite proves the running service is right from the outside. Between them sits a question neither answers cleanly: *do the parts wire together correctly, and does state behave across requests?* That is the integration layer.

The scoping decision is what keeps it distinct from the API suite:

- **In-process, not over a socket.** Tests drive `createApp()` directly through supertest — no separate server, no browser. Fast, deterministic, and able to spin up a *fresh app per test* for perfect isolation.
- **Collaboration is the target, not endpoints.** Each test exercises a path where several components must agree: a checkout that flows route → `Store` → domain pricing → persistence → retrieval, asserting the order the domain priced is the order persistence returns.
- **Cross-request and cross-session state.** The behaviours that only exist *between* calls: a cart surviving multiple requests under one token, two sessions sharing one `Store` without leaking into each other, a fresh instance starting clean. These are invisible to a unit test and awkward to force through the UI.

## 2. During — execution

Runs under the Vitest umbrella alongside unit and contract (CI gate 1) — seconds, no server process, no ports. A fresh in-process app per test means zero shared state and full parallelism without cleanup.

Because there is no network or browser, an integration failure points squarely at *wiring or state logic* — the causes are narrower than an API/UI failure, so triage is faster. It is the natural second question after a unit test passes but an API test fails: "do the components integrate?"

## 3. After — analysis

- **Exit criterion:** 100% pass. These guard the seams, and a broken seam is a real defect.
- This layer earns its keep by catching the bug that is *nobody's unit*: BUG-2026-001 (cart orphaned on re-login) lives entirely in cross-session state — no single unit is wrong, the *integration* is. That is exactly the defect class this scope exists for (see the [bug report](../reports/bug-reports/BUG-2026-001-orphaned-cart-on-relogin.md)).
- **Maintenance rule:** keep it thin. Integration is tempting to over-grow into a second API suite; it should only hold tests that genuinely need *multiple real components together*. Anything provable in a unit belongs in a unit.

## How it is applied here

| Decision | Where to see it |
| --- | --- |
| Fresh in-process app per test | `tests/integration/support.ts` — `newAgent()` |
| Route→domain→persistence→retrieval in one flow | `tests/integration/purchase-flow.int.test.ts` |
| Two sessions, one store, no leakage | `tests/integration/session-isolation.int.test.ts` |
| Domain invariant threaded up to HTTP intact | same — quantity-limit rejection preserves state |

## Field notes
- Integration tests are where "each piece works but the whole doesn't" gets caught. If your unit and API suites are both green and something's still broken, this is usually the missing layer.
- Prefer in-process (supertest) over a booted server for integration: same coverage of the wiring, a fraction of the flake and the runtime.
- The boundary with the API suite is a judgment call renewed per test — ask "does this need the *real running service*, or just the *real components*?" The answer picks the scope.
