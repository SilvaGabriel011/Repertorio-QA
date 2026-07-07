# Repertório QA

**A senior QA portfolio: one self-contained system under test, nine test scopes, and every decision written down.**

![CI](https://github.com/SilvaGabriel011/Repertorio-QA/actions/workflows/ci.yml/badge.svg)

Green checkmarks show that tests pass. They do not show *why these tests exist, what they deliberately leave out, or when they should be allowed to fail*. That reasoning lives in the documents below — they are the actual portfolio. The code is the evidence.

## 📚 Start with the documents

| Document | What it answers |
| --- | --- |
| [00 — Test Strategy](docs/00-test-strategy.md) | **Read this first.** The Cartesian method behind everything: four precepts, three lenses (before / during / after), one pyramid. |
| [01 — Unit Testing](docs/01-unit-testing.md) | Why business rules are tested in milliseconds, and how boundary analysis found the money. |
| [02 — Contract Testing](docs/02-contract-testing.md) | How consumer and provider stop breaking each other without an E2E environment. |
| [03 — API Testing](docs/03-api-testing.md) | Testing the service through its front door: status codes, error bodies, idempotency. |
| [04 — Smoke Testing](docs/04-smoke-testing.md) | The 20-second gate that decides whether any other suite deserves to run. |
| [05 — Regression Testing](docs/05-regression-testing.md) | What "protecting existing behaviour" means when every pixel of pricing is asserted. |
| [06 — E2E Testing](docs/06-e2e-testing.md) | Two journeys, not two hundred — and why the UI is cross-checked against the API. |
| [07 — Load Testing](docs/07-load-testing.md) | Baseline, stress and spike: three questions, three k6 scenarios, explicit thresholds. |
| [08 — Security Testing](docs/08-security-testing.md) | IDOR, brute force, enumeration, injection, hardening headers — tested, not assumed. |
| [09 — Accessibility Testing](docs/09-accessibility-testing.md) | WCAG 2.1 A/AA as an automated gate, and what automation cannot see. |
| [10 — Test Case Catalog](docs/10-test-case-catalog.md) | Manual test design: equivalence classes, boundaries, a decision table, state transitions, exploratory charters. |
| [11 — Defect Reporting](docs/11-defect-reporting.md) | How a bug becomes an unignorable, reproducible, regression-proof artifact. |

## What is under test

A deliberately small e-commerce ("QA Store") shipped inside this repo: Express API + vanilla JS storefront, in-memory state, zero external dependencies. Anyone can clone and run the entire portfolio offline — no flaky third-party demo sites.

```
 Browser (Playwright)          k6 (load)
        │                         │
        ▼                         ▼
 ┌─────────────────────────────────────┐
 │  QA Store  ·  src/api  (Express)    │───► static UI  src/api/public
 │  auth · catalog · cart · checkout   │
 └───────────────┬─────────────────────┘
                 ▼
        src/domain  (pure rules)
        pricing · cart · validators     ◄─── unit tests hit this directly
```

The domain has real teeth: tiered discounts, coupons that never stack, a free-shipping threshold a coupon can push you back under, quantity caps, login throttling. Small system, honest test problems.

## Scope map

| Scope | The one question it answers | Tool | Suite | Tests |
| --- | --- | --- | --- | --- |
| Unit | Is each business rule right, in isolation? | Vitest | `tests/unit` | 57 |
| Contract | Do consumer and provider still agree? | Pact | `tests/contract` | 5 |
| API | Does the service honour its HTTP semantics? | Playwright | `tests/api` | 37 |
| Smoke | Is the build worth testing at all? | Playwright | `tests/smoke` | 4 |
| Regression | Did anything that worked stop working? | Playwright | `tests/regression` | 20 |
| E2E | Can a user actually get to the end? | Playwright | `tests/e2e` | 2 |
| Security | Can the system be abused? | Playwright | `tests/security` | 19 |
| Accessibility | Can everyone use it? | axe-core | `tests/a11y` | 3 |
| Load | Does it hold under pressure? | k6 | `tests/load` | 3 scenarios |

Note the shape: 62 tests below the HTTP line, 83 at the API/UI line, 2 full journeys. That is the pyramid working as intended — see [the strategy](docs/00-test-strategy.md).

## Run it

```bash
npm install
npx playwright install chromium   # once

npm run test:unit        # domain rules, ~1s
npm run test:contract    # Pact consumer + provider verification
npm run test:smoke       # the gate
npx playwright test      # everything Playwright: api, security, a11y, regression, e2e
npm run test:load        # requires k6 and a running server (npm start)
npm run test:all         # typecheck + unit + contract + all Playwright projects
```

Playwright boots the system under test by itself (`webServer` in `playwright.config.ts`). For manual exploration: `npm start` → http://localhost:3000 → `alice.qa@example.com` / `S3curePass!` — coupons `WELCOME10`, `QA20`, and the expired `LEGACY30`.

## CI

Three sequential gates, ordered from simple to complex — cheap suites veto expensive ones (`.github/workflows/ci.yml`):

1. **Gate 1** — typecheck, unit, contract (seconds; catches most defects)
2. **Gate 2** — smoke first, then api + security + a11y + regression + e2e
3. **Gate 3** — k6 load baseline against the live service

## License

MIT — take whatever is useful.
