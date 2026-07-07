# 03 — API Testing

> The service tested through its front door: HTTP semantics, error bodies, state transitions — no browser in the way.
>
> **Where:** `tests/api` · **Tool:** Playwright request context · **Run:** `npm run test:api` · **Risks:** R1, R6

## 1. Before — design

The API is the product; the UI is one of its customers. So the API suite is the *widest* functional layer (37 tests) — everything the UI exercises plus everything it cannot: malformed payloads, boundary quantities, idempotency, coupon edge cases at exact cent values.

Design rules:

- **One endpoint, one spec file** (`auth`, `products`, `cart`, `checkout`) — failures localize by filename before you read a single line.
- **Negative space is half the suite.** Every endpoint has its 4xx behaviour asserted: exact status *and* exact error body. `{ "error": "quantity_limit" }` vs `{ "error": "invalid_quantity" }` is the difference between a UI that can explain itself and one that shrugs.
- **The oracle is independent.** Expected totals are computed by hand into the assertions (57 980 cents, not "whatever the domain lib returns"). Reusing production code as the oracle would make the test agree with the bug.
- **Semantics, not just status codes.** DELETE is asserted idempotent (204 twice). Failed checkout must *preserve* the cart; successful checkout must *clear* it. Those invariants are where real money bugs live.
- **Schema checks with zod** on collection responses — shape drift fails loudly and early.

Test data: each test logs in and owns an isolated session cart, so the suite runs fully parallel with zero cross-talk — isolation by design instead of cleanup choreography.

## 2. During — execution

Runs headless against the Playwright-managed server, in parallel, in seconds. The API suite is also the *debugging* layer: when a UI test fails, the first question is "does the API test for that behaviour pass?" — splitting front-end from back-end causes in one command.

Evidence on failure: full request/response in the Playwright report — the failing HTTP exchange is the bug report, nearly verbatim.

## 3. After — analysis

- **Exit criterion:** 100% pass. Every test maps to specified behaviour; a red here is a defect or an intentional spec change, never "flake".
- Failures triage by file → endpoint → assertion. Exact-body assertions mean a failure names the field that moved.
- **Maintenance rule:** the error-code vocabulary is a contract with the UI (`errorMessage()` in `app.js` consumes it). Changing a code without failing a test would mean the suite has a hole — that mapping is exactly what these tests pin.

## How it is applied here

| Decision | Where to see it |
| --- | --- |
| Exact-cent pricing oracles, computed independently | `tests/api/checkout.api.spec.ts` |
| The "coupon re-charges shipping" money case at API level | same file — $300 + WELCOME10 → $295, not $270 |
| Invalid quantities as a parameterized negative table | `tests/api/cart.api.spec.ts` — 0, 11, 1.5, "3", null, undefined |
| Idempotent DELETE, merge-not-duplicate on repeated add | same file |
| Anti-enumeration: wrong-password body ≡ unknown-user body | `tests/api/auth.api.spec.ts` + deeper in security suite |

## Field notes

- Test the API as a customer, not as its author: through HTTP only, asserting only what is promised. In-process shortcuts test a system nobody actually calls.
- Exact error bodies feel pedantic until the first time a "harmless" message rewording silently breaks three consumers.
- When a checkout test needs a cart, it seeds it through the API (`seedCart`), not through internals — setup paths are product behaviour too, and this way they are exercised hundreds of times per day for free.
