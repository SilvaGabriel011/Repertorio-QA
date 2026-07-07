# 04 — Smoke Testing

> Four tests, twenty seconds, one decision: is this build worth testing at all?
>
> **Where:** `tests/smoke` · **Tool:** Playwright · **Run:** `npm run test:smoke` · **Risk:** R5 (wasting the pipeline on a dead build)

## 1. Before — design

A smoke suite is defined by what it refuses to contain. The selection criterion is brutal: *if this fails, running anything else is pointless.* Four checks qualify:

1. The service answers (`/health`).
2. The catalog endpoint serves data without auth.
3. A user can sign in through the UI.
4. A signed-in user can put an item in the cart.

That is service-up, data-up, auth-up, core-loop-up. Nothing else earns a place — no edge cases, no error paths, no pricing math. Every candidate test must displace the question "does this tell me the build is *dead*?" — coupon validation does not; login does.

Depth-wise the suite deliberately crosses every layer once (HTTP → API → domain → UI → browser) rather than testing any layer thoroughly. Breadth-first, depth-never.

## 2. During — execution

Runs first in CI gate 2 — before api, security, regression and e2e — and as step zero when picking up any new environment. Target duration is under 30 seconds; the suite exists to *save* time, so its own cost is a feature under test. If smoke grows past a minute, it has become a small regression suite and stopped doing its job.

Locally it doubles as the "did I break the world?" check between changes — cheap enough to run reflexively.

## 3. After — analysis

- **Reading a red:** a smoke failure is a stop-the-line event. Nobody triages regression failures on a build whose login is down — the answer to "what else failed?" is "irrelevant".
- **Exit criterion:** 4/4, zero retries locally. Retries here would only teach the suite to lie about instability.
- **Maintenance rule:** re-audit membership whenever the critical path changes, and evict anything that has never been the *first* signal of a break. A smoke test that only fails when twenty regression tests also fail is dead weight in the hottest path of the pipeline.

## How it is applied here

| Decision | Where to see it |
| --- | --- |
| The four checks, tagged `@smoke` | `tests/smoke/critical-path.smoke.spec.ts` |
| Smoke as an explicit CI gate before the wide suites | `.github/workflows/ci.yml` — "Smoke gate" step |
| Mixed API + UI probes in one small file | same spec — two request-only, two browser tests |

## Field notes

- Smoke answers "is it alive?", regression answers "is it correct?" — the moment a suite tries to answer both, it answers neither on time.
- The best smoke test is one that has personally saved you an hour: mine is the auth check, because a broken login invalidates ~80% of any UI suite downstream.
- Keep smoke deterministic to the point of boredom. A flaky smoke gate trains the team to click "re-run" — and that habit is how real outages sail through pipelines.
