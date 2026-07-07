# 01 — Unit Testing

> The base of the pyramid. Verifies each business rule in isolation, in milliseconds, with no I/O.
>
> **Where:** `tests/unit` · **Tool:** Vitest · **Run:** `npm run test:unit` · **Risk:** R1 (wrong pricing)

## 1. Before — design

The question this scope answers: *is each business rule right, in isolation?* — so the first design act is making rules **isolatable**. Pricing, cart invariants and validators live in `src/domain` as pure functions and classes: no HTTP, no storage, no clock. Anything that cannot be unit-tested cheaply is a design smell, and testers should say so at design time, not after.

Case derivation is systematic, not inspirational:

- **Boundary value analysis** on every threshold: free shipping at 30 000 cents (29 999 / 30 000 / 30 001), volume discount at 100 000 (99 999 / 100 000), quantity limits at 1 and 10 (0 / 1 / 10 / 11).
- **Equivalence partitioning** on inputs: valid emails vs. structurally broken ones, one partition per password violation.
- **Decision coverage** on the discount policy: coupon only, volume only, both (best wins), tie (coupon wins), neither.
- **Error paths as first-class cases**: empty cart, expired coupon, unknown coupon, out-of-range quantities — each with the exact error code asserted.

Test data is inline and minimal — a unit test that needs a fixture file is integration in disguise.

## 2. During — execution

The suite runs in under a second, which is the point: it executes on every save, every commit, and as CI gate 1, before anything expensive is even attempted. There is no ordering, no shared state, no cleanup — each test builds its own world in three lines.

A healthy run is silent. The interesting runs are red ones, and the suite is built so a failure reads as a diagnosis: `rejects a merge that exceeds the 10-unit limit and keeps state intact` failing tells you *what rule* broke and *which invariant* — before you open a single file.

## 3. After — analysis

- **Exit criterion:** 100% pass, always. A unit suite with tolerated failures is a rumor mill, not an oracle.
- A red unit test is the cheapest defect you will ever fix — measured in minutes. The same defect surfacing in E2E costs hours; in production, a refund. This asymmetry is the entire business case for the pyramid's shape.
- **Maintenance rule:** when a bug escapes to a higher scope, the fix lands together with the unit test that would have caught it (see the escape analysis in [11 — Defect Reporting](11-defect-reporting.md)).

## How it is applied here

| Decision | Where to see it |
| --- | --- |
| Boundary tables as parameterized tests (`it.each`) | `tests/unit/pricing.test.ts` |
| Failed operations must not mutate state | `tests/unit/cart.test.ts` — limit rejected, quantity stays 9 |
| Money as integer cents; rounding asserted explicitly | `tests/unit/pricing.test.ts` — half-up at exactly .5 |
| One partition per password rule, plus the all-at-once case | `tests/unit/validators.test.ts` |

The boundary work paid for itself immediately: it forced the "coupon re-charges shipping" case ($300 order + 10% coupon → $270 → shipping is back → $295 total) to be *specified*, not discovered by a customer. That case is asserted at every level of the pyramid above this one.

## Field notes

- Test behaviour through the public surface. Asserting private internals welds the suite to the implementation, and refactors start failing tests that protect nothing.
- `it.each` tables keep boundary tests honest — one row per boundary value means a missing row is *visible* in review.
- If mocking is piling up, stop mocking and start redesigning: heavy mocks are the code telling you the seams are in the wrong place.
