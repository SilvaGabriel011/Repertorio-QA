# 07 — Load Testing

> Three questions about behaviour under pressure, three k6 scenarios, thresholds that turn "feels slow" into pass/fail.
>
> **Where:** `tests/load` · **Tool:** k6 · **Run:** `npm run test:load` (needs k6 + `npm start`) · **Risk:** R7 (degrades under traffic)

## 1. Before — design

Performance is not one question, so it is not one test. Three distinct questions, three scenarios:

| Scenario | Question | Shape | File |
| --- | --- | --- | --- |
| **Baseline** | Is it healthy under *expected* load? | 10 constant VUs, 30 s | `baseline.js` |
| **Stress** | Where does it start to *degrade*? | ramp 25 → 75 VUs | `stress.js` |
| **Spike** | Does it *survive and recover* from a sudden surge? | 5 → 100 in 10 s, hold, drop | `spike.js` |

Thresholds are set *before* running — a run with no pass/fail criterion is a benchmark, not a test. Baseline is strict (p95 < 300 ms, error rate < 1%, checks > 99%); stress and spike relax latency because their job is finding the knee and confirming recovery, not holding a fast SLO.

The workload is realistic, not uniform: a weighted mix (`__ITER % 5`) of browsing and buying, because a store is mostly window-shoppers and a load test that only hammers checkout measures a system nobody runs. Each virtual user authenticates and drives its own session — no shared token, no artificial contention the real world would not have.

## 2. During — execution

Load runs against a live server (`npm start`), never the Playwright-managed one, so functional and performance concerns stay separated. It is CI gate 3 — after correctness is proven, because load numbers from an incorrect build measure the wrong thing.

Baseline runs per pipeline; stress and spike run on demand (capacity planning, pre-launch, post-refactor) — they answer planning questions, not per-commit regression questions, and their cost does not belong in every build.

k6 streams live metrics; the run ends with per-threshold pass/fail. `check()` failures (functional errors under load) are tracked separately from latency — a fast 500 is still a failure, and conflating the two hides the ugliest bugs.

## 3. After — analysis

- **Read latency at percentiles, never the mean.** The average hides the users who are actually suffering; p95/p99 are where the pain and the churn live.
- **Two failure modes, two meanings.** Threshold breach on latency → capacity/performance work. `http_req_failed` or `checks` breach → a *correctness* bug that only appears under concurrency (race, pool exhaustion, leak). The second is the more dangerous and the reason checks are a threshold here.
- **Exit criterion:** baseline thresholds hold. Stress/spike produce a *number* (the knee, the recovery time) that feeds capacity planning — their deliverable is a datapoint, not a green tick.
- **Maintenance rule:** thresholds track the SLO. When the product promises a new latency budget, the threshold moves with it — in the same change, so the test always encodes the current promise.

## How it is applied here

| Decision | Where to see it |
| --- | --- |
| Thresholds declared up front, per scenario | `options.thresholds` in each of the three files |
| Weighted browse/buy mix, not uniform hammering | `baseline.js` — `__ITER % 5` |
| Per-VU authenticated session, realistic contention | `tests/load/helpers.js` — `purchase()` logs in per iteration |
| Functional checks tracked under load, separate from latency | `checks: ['rate>0.99']` threshold |

## Field notes

- A load test with no threshold is a science experiment: interesting, non-actionable. The number you commit to *before* the run is what makes it a test.
- Model the real traffic mix. The most expensive performance bugs hide in the ratio between endpoints, not in any single one.
- Correctness first, always. Fast wrong answers are the worst outcome a load test can bless — which is why `checks` is a gating threshold here, not a footnote.
