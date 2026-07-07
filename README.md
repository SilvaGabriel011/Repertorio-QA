# Repertório QA

**A senior QA portfolio: one self-contained system under test, ten test scopes, BDD specs, dual CI, and every decision written down.**

![CI](https://github.com/SilvaGabriel011/Repertorio-QA/actions/workflows/ci.yml/badge.svg)

Green checkmarks show that tests pass. They do not show *why these tests exist, what they deliberately leave out, or when they should be allowed to fail*. That reasoning lives in the documents below — they are the actual portfolio. The code is the evidence.

## 📚 Start with the documents

**Read [00 — Test Strategy](docs/00-test-strategy.md) first.** It states the method — a Cartesian one — that every other document applies: four precepts, three lenses (before / during / after), one pyramid.

**The scopes**, in pyramid order (simplest first):

| Document | The one question it answers |
| --- | --- |
| [01 — Unit](docs/01-unit-testing.md) | Is each business rule right, in isolation? |
| [12 — Integration](docs/12-integration-testing.md) | Do the components wire together, and does state survive across requests? |
| [02 — Contract](docs/02-contract-testing.md) | Do consumer and provider still agree? |
| [03 — API](docs/03-api-testing.md) | Does the service honour its HTTP semantics? |
| [04 — Smoke](docs/04-smoke-testing.md) | Is the build worth testing at all? |
| [05 — Regression](docs/05-regression-testing.md) | Did anything that worked stop working? |
| [06 — E2E](docs/06-e2e-testing.md) | Can a user actually get to the end? |
| [07 — Load](docs/07-load-testing.md) | Does it hold under pressure? |
| [08 — Security](docs/08-security-testing.md) | Can the system be abused? |
| [09 — Accessibility](docs/09-accessibility-testing.md) | Can everyone use it? |

**Practices & process** (not new rungs on the pyramid — different ways of driving and gating it):

| Document | What it covers |
| --- | --- |
| [13 — BDD with Cucumber](docs/13-bdd-cucumber.md) | Executable specs in business language, as living documentation |
| [14 — CI/CD Pipelines](docs/14-cicd-pipelines.md) | The quality gates as code, on GitHub Actions **and** Jenkins |

**The craft** (test design and defect handling, tool-agnostic):

| Document | What it covers |
| --- | --- |
| [10 — Test Case Catalog](docs/10-test-case-catalog.md) | Equivalence classes, boundaries, a decision table, state transitions, exploratory charters |
| [11 — Defect Reporting](docs/11-defect-reporting.md) | How a bug becomes a reproducible, regression-proof artifact |

**The deliverables** — what testing actually produces: [`reports/`](reports/README.md) holds sample bug reports (including one **rejected** as working-as-intended), a test-cycle sign-off with real failures, and quality telemetry.

## What is under test

A deliberately small e-commerce ("QA Store") shipped inside this repo: Express API + vanilla JS storefront, in-memory state, zero external dependencies. Anyone can clone and run the entire portfolio offline — no flaky third-party demo sites.

```
 Browser (Playwright)    supertest (in-process)    k6 (load)    Cucumber (BDD)
        │                        │                    │              │
        ▼                        ▼                    ▼              ▼
 ┌─────────────────────────────────────────────────────────────────────┐
 │  QA Store  ·  src/api  (Express)                                     │──► static UI
 │  auth · catalog · cart · checkout                                    │
 └───────────────┬─────────────────────────────────────────────────────┘
                 ▼
        src/domain  (pure rules)
        pricing · cart · validators              ◄── unit tests hit this directly
```

The domain has real teeth: tiered discounts, coupons that never stack, a free-shipping threshold a coupon can push you back under, quantity caps, login throttling. Small system, honest test problems.

## Scope map

| Scope | Question | Tool | Suite | Tests |
| --- | --- | --- | --- | --- |
| Unit | Each rule right, isolated? | Vitest | `tests/unit` | 57 |
| Integration | Components wired, state across requests? | supertest + Vitest | `tests/integration` | 8 |
| Contract | Consumer & provider agree? | Pact | `tests/contract` | 5 |
| API | HTTP semantics honoured? | Playwright | `tests/api` | 37 |
| Smoke | Build worth testing? | Playwright | `tests/smoke` | 4 |
| Regression | Anything break? | Playwright | `tests/regression` | 20 |
| E2E | Can a user finish? | Playwright | `tests/e2e` | 2 |
| Security | Can it be abused? | Playwright | `tests/security` | 19 |
| Accessibility | Can everyone use it? | axe-core | `tests/a11y` | 3 |
| Load | Holds under pressure? | k6 | `tests/load` | 3 scenarios |
| BDD | Do we share the spec? | Cucumber | `tests/bdd` | 9 scenarios |

**155 automated tests + 9 BDD scenarios.** The shape is the point: 70 below the HTTP line, 83 at the API/UI line, 2 full journeys — the pyramid working as intended ([strategy](docs/00-test-strategy.md)).

## Run it

```bash
npm install
npx playwright install chromium   # once

npm run test:unit          # domain rules, ~1s
npm run test:integration   # in-process component wiring
npm run test:contract      # Pact consumer + provider verification
npm run test:smoke         # the gate
npx playwright test        # everything Playwright: api, security, a11y, regression, e2e
npm run test:bdd           # Cucumber feature files
npm run test:load          # requires k6 and a running server (npm start)
npm run test:all           # typecheck + vitest + all Playwright projects
```

Playwright boots the system under test by itself (`webServer` in `playwright.config.ts`). For manual exploration: `npm start` → http://localhost:3000 → `alice.qa@example.com` / `S3curePass!` — coupons `WELCOME10`, `QA20`, and the expired `LEGACY30`.

## CI/CD — same strategy, two engines

The [quality gates](docs/14-cicd-pipelines.md) are encoded on **GitHub Actions** (`.github/workflows/ci.yml`) and **Jenkins** (`Jenkinsfile`), ordered simplest → most complex so a cheap failure vetoes the expensive work after it:

1. **Gate 1** — typecheck · unit · integration · contract (seconds; catches most defects)
2. **Gate 2** — smoke → api · security · a11y · regression · e2e
3. **Gate 3** — BDD (Cucumber)
4. **Gate 4** — k6 load baseline against the live service

Every suite emits JUnit XML or Cucumber JSON; reports and traces are archived as artifacts even on failure.

## License

MIT — take whatever is useful.
