# 14 — CI/CD Pipelines

> The quality gates from the [strategy](00-test-strategy.md), encoded as pipelines on two engines. Same philosophy, two dialects: **GitHub Actions** and **Jenkins**.
>
> **Where:** `.github/workflows/ci.yml`, `Jenkinsfile` · **Risk:** R5 (a broken build wastes the pipeline)

## 1. Before — design

A pipeline is the test strategy made executable and non-negotiable. The design principle is the ordering precept: **arrange gates simplest → most complex, and let a cheap failure veto the expensive work after it.** Running a 20-second load test on a build whose unit tests are red is waste; the gate order guarantees it never happens.

The same gates are expressed on two engines on purpose — to show the *strategy* is portable and the *tool* is an implementation detail:

| Gate | Suites | Vetoes |
| --- | --- | --- |
| 1 | typecheck · unit · integration · contract | everything |
| 2 | smoke → api · security · a11y · regression · e2e | gates 3–4 |
| 3 | BDD (Cucumber) | gate 4 |
| 4 | load baseline (k6) | release |

Design decisions common to both engines:
- **Fail fast, fail cheap** — gate 1 is seconds and catches most defects.
- **Machine-readable output** — every suite emits JUnit XML (Vitest, Playwright) or Cucumber JSON, so the CI UI shows *which test*, not just "the build failed".
- **Evidence on failure** — Playwright traces, reports and k6 summaries are archived as artifacts.

## 2. During — execution

**GitHub Actions** (`ci.yml`) — three jobs chained by `needs:`, triggered on push/PR. Each job sets up Node, installs, runs its gate, and uploads artifacts with `if: always()` so a red build still yields its evidence.

**Jenkins** (`Jenkinsfile`) — a declarative pipeline with the same stages. `JUNIT_OUTPUT` routes Vitest's report; Playwright writes JUnit in CI mode; Cucumber emits JSON. The `post { always { … } }` block publishes `junit` results and archives reports whether the build passed or failed. `disableConcurrentBuilds` and a timeout keep the agent honest.

Both boot the real SUT for the load gate and poll `/health` before driving traffic — no fixed sleeps, which are the oldest source of CI flake.

## 3. After — analysis

- **Reading a red pipeline:** the *first* failing gate is the diagnosis; later gates were skipped by design, so there is exactly one place to look.
- **JUnit/JSON reporting** turns "pipeline failed" into "`checkout › coupon wins the tie` failed on line 42" — the report is the first triage step, before anyone opens a log.
- **Flaky policy:** a test that fails then passes on re-run is quarantined and fixed, never blindly retried into green (Playwright retries are capped at 1 in CI and treated as a smell to investigate, not a solution). See the flake handled in [Cycle 41](../reports/test-execution/cycle-41-execution-report.md).
- **Maintenance rule:** the pipeline *is* the strategy — when a scope is added, both engines gain a stage in the same PR, so neither drifts from the truth.

## How it is applied here

| Decision | Where to see it |
| --- | --- |
| Gates ordered cheap→expensive, veto downstream | `ci.yml` job `needs:` · `Jenkinsfile` stage order |
| JUnit from Vitest + Playwright | `vitest.config.ts` (`JUNIT_OUTPUT`), `playwright.config.ts` |
| Cucumber JSON for the CI reporter | `Jenkinsfile` — BDD stage |
| Health-poll before load, no fixed sleeps | both pipelines' load gate |
| Evidence archived even on failure | `if: always()` / `post { always }` |

## Field notes
- The gate order is the single highest-leverage decision in CI. Cheap-first isn't just fast — it means the failure you see is almost always the *root* failure, not a downstream symptom.
- Portability across two engines is a feature: it proves the quality bar lives in the *strategy*, not in one vendor's YAML. A team could switch CI tomorrow and lose nothing.
- Never solve a flaky test with more retries. Retries hide the flake; the next person inherits it as an outage. Quarantine, root-cause, fix.
