# 13 — BDD with Cucumber

> Executable specifications in business language. **Not a new test level — a different way of *writing* one**, so the spec doubles as living documentation.
>
> **Where:** `tests/bdd` · **Tool:** Cucumber (Gherkin) · **Run:** `npm run test:bdd` · **Risks:** R1, R3 (shared understanding of the rules)

## 1. Before — design

First, the honest framing a senior owes the reader: **BDD is not a rung on the pyramid.** These scenarios drive the same service the API suite drives; what changes is *who can read the test and who helps write it*. The value is not extra coverage — it is a shared, unambiguous description of behaviour that a product owner, a developer and a tester all agree on *before* code exists.

So the design question is "which behaviours benefit from being specified in ubiquitous language?" — the ones where the *rules* are the risk and stakeholders have opinions:

- **Checkout pricing** — discounts, thresholds, the coupon-crosses-threshold case. Business rules people argue about; Gherkin ends the argument with an example.
- **Authentication outcomes** — success, refusal, lockout — stated as observable behaviour, not implementation.

What is deliberately *not* in Gherkin: boundary tables, malformed payloads, header assertions. Writing `Then the X-Frame-Options header is DENY` in business language is ceremony — that belongs in the API/security suites. BDD is for behaviour a non-engineer would recognise.

Structure follows the same three-part shape as everything else: **Given** (before/context) → **When** (during/action) → **Then** (after/outcome). The method is fractal.

## 2. During — execution

A custom World gives each scenario a fresh in-process app (via supertest), so scenarios are isolated and fast. Step definitions are the *only* place technical detail lives; the `.feature` files stay pure business language. Runs as its own gate (CI gate 3); `Scenario Outline` + `Examples` tables express data-driven cases without duplicating prose.

The `.feature` files are the artifact non-engineers actually read — they are documentation that cannot go stale, because it fails the build when it lies.

## 3. After — analysis

- **Exit criterion:** all scenarios green. A red scenario is either a real behaviour change or a spec that needs a conversation — both are useful signals.
- **Living documentation:** the value compounds after the test passes. Six months later, "how does the coupon-vs-volume rule work?" is answered by a readable scenario, not by reading `pricing.ts`.
- **Maintenance rule — the real cost of BDD:** step definitions are indirection, and indirection has upkeep. Reuse steps ruthlessly, keep the vocabulary small, and resist Gherkin-ing every test. BDD applied to everything becomes a slow, brittle second suite that helps no one. Applied to the rules that matter, it is the clearest spec you will own.

## How it is applied here

| Decision | Where to see it |
| --- | --- |
| Pure business language in features | `tests/bdd/features/checkout_pricing.feature` |
| Data-driven rules via Scenario Outline | same — invalid-coupon examples table |
| Technical detail confined to steps | `tests/bdd/steps/*.ts` |
| Fresh isolated app per scenario | `tests/bdd/support/world.ts` |

## Field notes
- Gherkin is a *communication* tool first and a test framework second. If no non-engineer will ever read the feature file, you probably wanted a plain API test.
- The `Given/When/Then` discipline is worth stealing even outside Cucumber — it forces you to separate setup, action and assertion, which is the same before/during/after lens this whole portfolio runs on.
- Watch the step-definition sprawl. The failure mode of BDD is a thousand bespoke steps; the healthy state is a small, composable vocabulary that reads like the domain.
