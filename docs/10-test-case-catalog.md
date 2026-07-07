# 10 — Test Case Catalog

> Test *design*, shown explicitly. Automation proves cases run; this document proves they were **chosen** by technique, not by intuition.

Every automated test in this repo descends from a design decision made here. This is the enumeration precept made visible: the reasoning that decides *which* cases exist, before any code runs.

## Techniques and where each is used

| Technique | Answers | Applied to |
| --- | --- | --- |
| Equivalence Partitioning | Which inputs are "the same"? | email, password, search query |
| Boundary Value Analysis | Where do the bugs actually live? | shipping / volume thresholds, quantity 1–10 |
| Decision Table | Which combination wins? | discount policy (coupon × volume) |
| State Transition | Which sequences are legal? | authentication + checkout flow |
| Exploratory Charters | What did we not think to specify? | time-boxed, chartered sessions |

---

## Boundary Value Analysis — the free-shipping threshold

Free shipping applies when the **post-discount** total ≥ 30 000 cents. Bugs cluster at the edge, so the edge is where cases cluster:

| ID | Post-discount total (cents) | Boundary | Expected shipping | Automated in |
| --- | --- | --- | --- | --- |
| BVA-1 | 29 999 | just below | 2 500 | unit |
| BVA-2 | 30 000 | exactly on | 0 | unit |
| BVA-3 | 30 001 | just above | 0 | unit |
| BVA-4 | 30 000 → 27 000 (coupon) | crosses back below | 2 500 | unit + api + regression |

BVA-4 is the case a boundary table finds and ad-hoc testing misses: a coupon on a $300 order drops it under the threshold and shipping **returns**. It is asserted at three levels because it is where R1 (wrong pricing) is most likely to hide.

## Boundary Value Analysis — quantity (valid range 1–10)

| Input | Partition | Verdict |
| --- | --- | --- |
| 0 | below min | reject `invalid_quantity` |
| 1 | min edge | accept |
| 10 | max edge | accept |
| 11 | above max | reject `quantity_limit` |
| 1.5 | non-integer | reject `invalid_quantity` |
| "3" | wrong type | reject `invalid_quantity` |

Note two *different* rejections at the upper edge: a single item over 10 is `invalid_quantity`; a **merge** that would exceed 10 is `quantity_limit`. Same boundary, different cause, different message — and the invariant that a rejected merge leaves the existing quantity untouched.

## Decision Table — discount policy

Rules: coupon and volume (≥ 1 000.00) never stack; the higher percentage wins; a tie goes to the coupon.

| Coupon | Subtotal ≥ 1000 | → Source | → % off | Case |
| --- | --- | --- | --- | --- |
| none | no | none | 0 | plain order |
| none | yes | volume | 10 | auto volume |
| WELCOME10 (10%) | no | coupon | 10 | coupon only |
| WELCOME10 (10%) | yes | coupon | 10 | **tie → coupon wins** |
| QA20 (20%) | yes | coupon | 20 | coupon beats volume |
| expired | any | — | reject | `coupon_expired` |
| invalid | any | — | reject | `coupon_invalid` |

Seven rules, every one automated (`tests/unit/pricing.test.ts`, `tests/api/checkout.api.spec.ts`). The tie row is the subtle one — "≥" vs ">" in one comparison is the whole bug, and this row is what pins the decision.

## State Transition — checkout flow

```
[Anonymous] --login ok--> [Catalog] --add item--> [Catalog+Cart]
     ^                        |                         |
     |                     logout                    checkout
     |                        |                         v
     +------------------------+                    [Checkout] --place order--> [Confirmed]
                                                       |   ^                        |
                                              invalid coupon                  continue shopping
                                                   (stay)                           v
                                                                              [Catalog] (empty cart)
```

Cases derived — both the legal paths **and** the illegal ones that must be refused:

- **Valid transitions:** anonymous→catalog→cart→checkout→confirmed→catalog. *(e2e)*
- **Guard on empty cart:** checkout button disabled at quantity 0. *(regression)*
- **Invalid-input self-loop:** a bad coupon keeps you on checkout, cart intact. *(regression)*
- **Illegal jumps refused:** `/api/checkout` without a session → 401; without items → 422; `/api/cart` on an expired token → 401. *(api + security)*
- **Session persistence:** reload preserves the current state; logout resets to anonymous. *(regression)*

## Exploratory testing — charters

Scripted cases verify the known; exploration finds the unknown. Time-boxed, chartered (Session-Based Test Management), with a clear mission per session:

> **Charter 1** — Explore *coupon + quantity + threshold interactions* to discover **pricing inconsistencies**, using boundary combinations. → surfaced BVA-4 (shipping returns when a coupon crosses the threshold down). Now a permanent test.

> **Charter 2** — Explore *session and ownership boundaries* to discover **data-leak paths**, using a second account. → confirmed IDOR and cart-isolation defences hold; codified as security regressions.

> **Charter 3** — Explore *rapid repeated actions* (double-click add, spam +, back/forward) to discover **state-desync bugs**, using an unreliable-network mindset.

The pattern for any finding: reproduce → isolate → write the lowest-level test that catches it → fix. Exploration *discovers*; the pyramid *retains*.

## Traceability

Each case maps to a risk (00) and an automated spec, so coverage is auditable end to end:

| Case group | Risk | Spec |
| --- | --- | --- |
| Shipping/volume boundaries | R1 | `tests/unit/pricing.test.ts`, `tests/api/checkout.api.spec.ts` |
| Discount decision table | R1 | same |
| Checkout state machine | R6 | `tests/e2e`, `tests/regression/checkout.regression.spec.ts` |
| Ownership / session boundaries | R2 | `tests/security/auth.security.spec.ts` |
| Credential attacks | R3 | same |
