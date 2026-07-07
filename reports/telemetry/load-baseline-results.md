# Load Telemetry — Baseline Run

> Output of `npm run test:load` (`tests/load/baseline.js`) against the SUT. *Representative sample of a healthy run; see [docs/07](../../docs/07-load-testing.md) for the method.*

## Run configuration

| | |
| --- | --- |
| Scenario | `steady_traffic` — 10 constant VUs, 30 s |
| Workload | weighted browse/buy mix (1 purchase per 5 iterations) |
| Target | `http://localhost:3000` (single Node process) |
| k6 | v0.57 |

## Thresholds (pass/fail set before the run)

| Threshold | Budget | Observed | Status |
| --- | --- | --- | :---: |
| `http_req_duration` p95 | < 300 ms | 41 ms | ✅ |
| `http_req_failed` rate | < 1% | 0.00% | ✅ |
| `checks` rate | > 99% | 100% | ✅ |

## Latency distribution

| Percentile | Latency |
| --- | ---: |
| p50 | 8 ms |
| p90 | 27 ms |
| p95 | 41 ms |
| p99 | 88 ms |
| max | 143 ms |

Read at percentiles, never the mean — p99 is where the unlucky user lives.

## Per-endpoint

| Endpoint | Requests | p95 | Error rate |
| --- | ---: | ---: | ---: |
| `GET /api/products` | 4 812 | 22 ms | 0% |
| `GET /api/products/:id` | 4 812 | 19 ms | 0% |
| `POST /api/auth/login` | 1 203 | 63 ms | 0% |
| `POST /api/cart` | 1 203 | 34 ms | 0% |
| `POST /api/checkout` | 1 203 | 58 ms | 0% |

## Verdict

**PASS.** Baseline SLO held under expected load; login/checkout are the hottest paths (write + auth work), which is where stress and spike scenarios should push next. No functional check failed under concurrency — no fast-wrong-answers.

## What this run does *not* tell you
Baseline answers "healthy under expected load?" only. The knee (stress) and recovery-from-surge (spike) are separate questions with their own scenarios (`stress.js`, `spike.js`), run on demand for capacity planning — not gated per commit.
