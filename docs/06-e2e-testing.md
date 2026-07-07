# 06 — E2E Testing

> Two complete journeys through the real stack — browser to domain and back. The top of the pyramid, kept deliberately narrow.
>
> **Where:** `tests/e2e` · **Tool:** Playwright · **Run:** `npm run test:e2e` · **Risk:** R6 (a purchase cannot be completed)

## 1. Before — design

E2E answers one question the lower scopes cannot: *do the parts, each verified alone, actually compose into something a person can finish?* That question needs very few tests to answer — this suite has two:

1. **The representative shopper** — sign in, search, build a mixed cart, apply a coupon, place the order, verify the confirmation, continue shopping with an empty cart.
2. **The volume shopper** — a second persona (Bob) crossing the 1 000.00 threshold, proving the automatic discount composes with free shipping without a coupon in play.

Selection rule: journeys mirror *personas completing goals*, not features. Feature coverage already happened downstairs — API tested every coupon error, unit tested every boundary. E2E re-testing those through a browser would buy the same information at 100× the cost and 10× the flake surface. This is the enumeration precept working in reverse: knowing what is already covered is what licenses the suite to stay small.

One design signature: the first journey ends by fetching the created order **through the API** and comparing it with what the UI displayed. UI-only assertions can pass while the persistence layer stores nonsense; the cross-check pins screen and state to each other — consistency across layers is precisely what E2E exists to prove.

## 2. During — execution

Runs last in CI gate 2, after smoke/api/security/regression have all passed — by then, an E2E failure almost certainly means *composition* broke (wiring, state handoff, navigation), which is exactly the residue this suite exists to catch. Each journey is internally sequential (that is the point of a journey) but the two run in parallel, isolated by persona.

Failures leave the full flight recorder: trace, screenshots, network log — enough to replay the journey step by step without re-running it.

## 3. After — analysis

- **Exit criterion:** both journeys green before any release. No exceptions — this is the closest simulation of the only event that matters commercially.
- A red here after green lower gates is high-signal: read the trace, find the seam (usually state handoff between views, or UI/API drift the contract did not cover), and ask which *cheaper* scope should have owned it.
- **Maintenance rule:** the suite grows only when a genuinely new *journey* ships (a new persona goal — returns, say), never when a feature ships. Features grow the lower suites.

## How it is applied here

| Decision | Where to see it |
| --- | --- |
| UI↔API consistency cross-check on the final order | `tests/e2e/purchase-journey.e2e.spec.ts` — exact cents, both layers |
| Distinct personas, parallel-safe | Alice journey + Bob journey |
| Journey ends where the user's mental loop ends | continue shopping → catalog again, badge `0` |

## Field notes

- The pyramid's top is a *budget*, not a shelf. Every E2E test you add spends run time and flake risk forever; make each one carry a whole journey's worth of information.
- When E2E and API disagree, believe neither — find the seam. The disagreement itself is the defect report.
- An E2E suite that never fails is as suspicious as one that always does. Two honest journeys that fail loudly on composition breaks beat forty ceremonial ones nobody reads.
