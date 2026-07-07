# 05 — Regression Testing

> Protects what already works. Twenty UI tests assert that yesterday's behaviour survived today's commit.
>
> **Where:** `tests/regression` · **Tool:** Playwright + page objects · **Run:** `npm run test:regression` · **Risks:** R1, R6

## 1. Before — design

Regression is not "all tests" — it is the *specified, user-visible behaviour* of features that already shipped, organized by feature: `auth`, `cart`, `checkout`. Three sources feed the suite, in priority order:

1. **Money paths** — every pricing rule visible on the confirmation screen, asserted to the cent (`$295.00`, not "a total is shown").
2. **Invariants users rely on** — session survives reload, cart survives reload, logout actually logs out, a failed coupon does not eat the cart.
3. **Escaped defects** — the standing rule: any bug found in exploration or production earns a permanent regression test on fix (see [11 — Defect Reporting](11-defect-reporting.md)).

Two structural decisions keep 20 UI tests fast and honest:

- **Page objects** (`tests/support/pages.ts`) — specs read as behaviour ("add to cart, expect badge 1"), selectors live in one place, and a UI relayout is a one-file change instead of a 20-test rewrite.
- **API-seeded state** (`seedCart`) — a checkout test does not click "add to cart" eleven times; it seeds via API and spends its budget on what it actually tests. UI setup steps are already covered by the cart tests — repeating them elsewhere is cost without information.

## 2. During — execution

Fully parallel: every test logs in via API fixture (`signedIn`), owns an isolated session cart, and touches no shared state. No ordering, no cleanup, no "run this one first". Suites that need choreography eventually get it wrong on the worst possible Friday.

Trace and screenshot are captured on failure only (`playwright.config.ts`) — green runs stay cheap, red runs arrive with a full flight recorder.

## 3. After — analysis

- **Exit criterion:** 100% pass before merge. One retry is tolerated in CI for environmental noise — but a test that *needs* the retry twice in a week is quarantined and fixed, not tolerated. Flakiness is a defect in the test with the same severity as a defect in the product: both erode the only thing a suite has, credibility.
- Failures triage by feature file first, then the failing assertion names the behaviour (each test asserts one).
- **Maintenance rule:** when behaviour changes intentionally, the test changes *in the same PR* — a suite that lags the product teaches people to ignore red.

## How it is applied here

| Decision | Where to see it |
| --- | --- |
| Exact-cent assertions on the confirmation screen | `tests/regression/checkout.regression.spec.ts` |
| The shipping-comes-back coupon case, at UI level | same file — `$300.00 − $30.00 + $25.00 = $295.00` |
| Server-rejected action surfaces a human message, state intact | `tests/regression/cart.regression.spec.ts` — 10-unit cap |
| Login/logout/reload session invariants | `tests/regression/auth.regression.spec.ts` |

## Field notes

- The UI never computes prices here — it renders what the server sent (assertions confirm the *server's* numbers travel intact). Keeping the client dumb keeps the regression surface small; the pricing brain is regression-tested at unit level for a fraction of the cost.
- `data-testid` selectors are a public contract between the app and its tests. CSS classes are styling; the day someone renames `.btn-primary`, tests keyed to it fail for a reason users never saw.
- Growth discipline: before adding a regression test, ask which *lower* scope could catch the same defect. The UI suite gets only what genuinely needs a browser to prove.
