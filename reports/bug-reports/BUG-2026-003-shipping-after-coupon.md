# BUG-2026-003 — "Applying a coupon removed my free shipping"

| Field | Value |
| --- | --- |
| **Status** | ❌ Rejected — Working as Intended |
| **Severity** | — (not a defect) |
| **Priority** | — |
| **Component** | `src/domain/pricing.ts` |
| **Reported by** | Product stakeholder |
| **Triaged by** | G. Silva (QA) |

## Original report (as filed)
> "Bug: a 300.00 order ships free, but the moment I add coupon `WELCOME10` I get charged 25.00 shipping. The coupon is making the order *more* expensive to ship — clearly broken."

## Investigation
Reproduced exactly as described:

| Step | Value |
| --- | --- |
| Subtotal (1 × HD Webcam) | 300.00 |
| Coupon WELCOME10 (−10%) | −30.00 |
| Post-discount total | **270.00** |
| Free-shipping threshold | 300.00 (evaluated **after** discount) |
| 270.00 < 300.00 → shipping | 25.00 |
| Final total | **295.00** (still less than the 300.00 they'd have paid) |

The rule is specified: free shipping is granted on the **post-discount** total, by design (see the pricing rules in [docs/01](../../docs/01-unit-testing.md) and the boundary case BVA-4 in the [test catalog](../../docs/10-test-case-catalog.md)). The coupon lowered the amount the customer pays overall (295.00 < 300.00); it did not "break" anything.

## Resolution
**Closed as Working as Intended.** No code change. The behaviour is correct and covered by tests at three levels (unit, api, regression).

## Follow-up (spun off, not lost)
The report is a real signal about **clarity**, even though it is not a bug. Raised **UX-2026-018**: on checkout, when a coupon pushes an order back under the free-shipping line, surface a hint ("Add 30.00 to get free shipping"). A rejected bug that improves the product is a good outcome.

## Notes
The senior move here is not writing code — it is separating *"the system is wrong"* from *"the system surprised me"*. Reproducing, mapping to the specified rule, and converting the confusion into a UX ticket closes the loop without corrupting a correct pricing engine.
