# Test Execution Report — Cycle 41

| | |
| --- | --- |
| **Cycle** | 41 |
| **Release** | 1.4.0 |
| **Builds exercised** | `1.4.0-rc.1` → `1.4.0-rc.2` |
| **Window** | 2026-06-22 → 2026-06-25 |
| **Environment** | Node 22 · Chromium · in-memory SUT |
| **QA** | G. Silva |
| **Verdict** | ✅ **PASS** on `rc.2` (1 known issue accepted) |

## Entry criteria (before)
- [x] Build deploys and `/health` is green
- [x] Smoke suite passes on the candidate build
- [x] No open Critical/Blocker defects carried in
- [x] Test data and accounts seeded

All met → cycle authorised to start.

## Execution summary — `rc.1` (first pass)

| Suite | Planned | Passed | Failed | Result |
| --- | ---: | ---: | ---: | :---: |
| Unit | 57 | 56 | 1 | ❌ |
| Contract | 5 | 5 | 0 | ✅ |
| API | 37 | 37 | 0 | ✅ |
| Smoke | 4 | 4 | 0 | ✅ |
| Regression | 20 | 20 | 0 | ✅ |
| E2E | 2 | 1 | 1 | ❌ (flaky) |
| Security | 19 | 19 | 0 | ✅ |
| Accessibility | 3 | 2 | 1 | ❌ |
| **Total** | **147** | **144** | **3** | ❌ |

**Exit criteria NOT met on `rc.1`** — 3 failures triaged below.

## Failure analysis (during)

| # | Test | Diagnosis | Outcome |
| --- | --- | --- | --- |
| 1 | `pricing › coupon wins the tie at equal percentages` | Real defect — tie resolved to volume, not coupon | → [BUG-2026-002](../bug-reports/BUG-2026-002-discount-tie-favored-volume.md), fixed in `rc.2` |
| 2 | `a11y › catalog view has no violations` | Real defect — quantity steppers unlabeled (WCAG 4.1.2) | → [BUG-2026-004](../bug-reports/BUG-2026-004-unlabeled-quantity-buttons.md), fixed in `rc.2` |
| 3 | `e2e › shopper … applies a coupon` | **Flaky** — asserted badge text before the async cart refresh settled | Test defect, not product. Quarantined, fixed with a web-first assertion, un-quarantined |

Two product defects, one test defect. The e2e flake is logged as rigorously as the product bugs — an unreliable test is a defect in the suite (see [docs/05](../../docs/05-regression-testing.md)).

## Re-test — `rc.2` (after fixes)

| Suite | Passed | Failed |
| --- | ---: | ---: |
| **All 8 suites** | **147** | **0** ✅ |

Both product fixes verified against their reproduction steps; the previously-flaky e2e test ran 20× consecutively with zero failures before being trusted again.

## Also raised this cycle
- **[BUG-2026-003](../bug-reports/BUG-2026-003-shipping-after-coupon.md)** — stakeholder report, triaged **Working as Intended** (not a defect); spun off UX-2026-018.

## Exit criteria (after)
- [x] 100% of planned tests executed
- [x] 0 failing tests on `rc.2`
- [x] 0 open Critical/High defects
- [x] All fixes carry a regression test
- [x] Known issues documented and risk-accepted → **none open above Medium**

**Sign-off:** `1.4.0-rc.2` recommended for release. — G. Silva, 2026-06-25

## Retrospective note
The two product defects were caught by the *cheapest* suites able to see them (unit, a11y scan) — shift-left working as designed. The flaky e2e is the cycle's real lesson: it briefly eroded trust in a green run, which is the one thing a suite cannot afford. Root-caused to an assertion that didn't wait; the fix pattern was folded into the page objects so the class of flake cannot recur.
