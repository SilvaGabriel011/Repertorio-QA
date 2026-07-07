# Quality Telemetry — 2026 Q2

> A green run is a snapshot. Quality is a *trend*. This report is how the health of the test effort is measured over time — the "after" lens applied to the whole strategy, not a single cycle.
>
> *Sample values illustrative of the format; the SUT, suites and defects referenced are real to this repo.*

## 1. Test inventory & speed (during)

| Scope | Tests | Typical wall-clock | Layer |
| --- | ---: | ---: | --- |
| Unit | 57 | ~0.8 s | below HTTP |
| Integration | 8 | ~1.2 s | below HTTP |
| Contract | 5 | ~1.4 s | below HTTP |
| API | 37 | ~4 s | service |
| Smoke | 4 | ~3 s | service/UI |
| Security | 19 | ~3 s | service |
| Accessibility | 3 | ~4 s | UI |
| Regression | 20 | ~6 s | UI |
| E2E | 2 | ~2 s | UI |
| BDD (Cucumber) | 9 scenarios | ~0.1 s | spec/service |
| **Automated total** | **155 + 9** | **< 30 s full** | |

**Pyramid distribution** — 70 tests below the HTTP line, 83 at service/UI, 2 full journeys. Healthy: heavy at the base, light at the tip.

```
below-HTTP  ████████████████████████████  70   (45%)
service/UI  ██████████████████████████████████  83  (54%)
journeys    █  2  (1%)
```

## 2. Defect metrics (after)

| Metric | Value | Note |
| --- | --- | --- |
| Defects found (quarter) | 4 | 2 valid+fixed, 1 accepted, 1 rejected |
| Escaped to production | **0** | all caught pre-release or risk-accepted |
| Rejection rate | 25% (1/4) | BUG-003 — a clarity issue, not a defect |
| Mean time to fix (valid) | < 1 day | both fixed within the finding cycle |
| Reopened defects | 0 | every fix shipped with a regression test |

### Where defects were caught (shift-left evidence)

| Stage caught | Count | Defect |
| --- | ---: | --- |
| Unit | 1 | BUG-002 (discount tie) |
| Accessibility scan | 1 | BUG-004 (unlabeled steppers) |
| Integration | 1 | BUG-001 (orphaned cart) |
| Triage (stakeholder) | 1 | BUG-003 (rejected) |

Every valid defect was caught by the *cheapest suite able to see it* — the entire economic argument of the [strategy](../../docs/00-test-strategy.md), quantified.

### Defect density by component

| Component | Defects | Signal |
| --- | ---: | --- |
| `domain/pricing.ts` | 1 | boundary/comparison — highest-risk code, most-tested |
| `api/public` (UI) | 1 | accessibility affordance |
| `api/store.ts` | 1 | cross-session state |

## 3. Suite reliability

| Metric | Value | Target | Status |
| --- | --- | --- | :---: |
| Flaky rate | 0.6% (1/155) | < 1% | ✅ |
| Mean time to quarantine a flake | 1 cycle | ≤ 1 cycle | ✅ |
| Pass rate on release build | 100% | 100% | ✅ |

**Pass-rate trend (release candidates):**

```
Cycle 39  ██████████████████  100%
Cycle 40  █████████████████   98%  (2 fixed pre-release)
Cycle 41  █████████████████   98%  (3 findings → rc.2 green)
Cycle 42  ██████████████████  100%
```

## 4. Traceability coverage

Every automated test maps to a risk in the register (R1–R8). Coverage of the risk register: **8/8 risks** exercised by ≥1 scope. No test exists without a risk; no risk exists without a test. Audited in the [test catalog](../../docs/10-test-case-catalog.md).

## Reading these numbers
- **Escape rate is the headline.** 0 escaped defects is the number a release owner actually cares about; everything else explains *why* it was zero.
- **Flaky rate is the leading indicator.** It trends *before* trust erodes — watched more closely than pass rate, which is a lagging one.
- **Density points the next cycle.** Pricing carries the most risk and the most tests and still produced a defect — so exploratory time keeps going there, not to where it is quiet.
