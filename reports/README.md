# QA Reports & Artifacts

The scope documents in [`../docs`](../docs) explain *how* this system is tested. This folder holds the **deliverables that testing produces** — the paper trail a senior QA leaves behind: defects, cycle sign-offs, and quality telemetry.

> These are representative artifacts generated against the system under test in this repo. Where a live pipeline or production would supply real numbers (telemetry, load results), the values here are illustrative samples — the *format, rigour and reasoning* are the point, not the digits.

## What's here

| Folder | Artifact | Reading it tells you |
| --- | --- | --- |
| [`bug-reports/`](bug-reports) | Individual defect reports | How a bug is isolated, written and closed — including one that was **rejected** as working-as-intended |
| [`test-execution/`](test-execution) | Test cycle sign-off reports | How a release is judged against entry/exit criteria, failures and all |
| [`telemetry/`](telemetry) | Quality metrics & load results | How quality is measured over time, not just at a single green run |

## The defect log at a glance

| ID | Title | Severity | Status | Caught by |
| --- | --- | --- | --- | --- |
| [BUG-2026-002](bug-reports/BUG-2026-002-discount-tie-favored-volume.md) | Discount tie applied volume instead of coupon | High | ✅ Fixed & verified | Exploratory (Charter 1) |
| [BUG-2026-004](bug-reports/BUG-2026-004-unlabeled-quantity-buttons.md) | Quantity steppers had no accessible name | Medium | ✅ Fixed & verified | Accessibility scan |
| [BUG-2026-001](bug-reports/BUG-2026-001-orphaned-cart-on-relogin.md) | Cart is orphaned on re-login | Medium | 🔲 Open (backlog) | Integration testing |
| [BUG-2026-003](bug-reports/BUG-2026-003-shipping-after-coupon.md) | Shipping charged after coupon | — | ❌ Rejected (works as intended) | Stakeholder report |

Every fixed defect landed with the regression test that keeps it dead — the through-line from [defect reporting](../docs/11-defect-reporting.md) to the [strategy](../docs/00-test-strategy.md).
