# BUG-2026-002 — Discount tie applied the volume discount instead of the coupon

| Field | Value |
| --- | --- |
| **Status** | ✅ Fixed & Verified |
| **Severity** | High (wrong money on a core flow) |
| **Priority** | High |
| **Component** | `src/domain/pricing.ts` |
| **Found in** | Cycle 41 · build 1.4.0-rc.1 · exploratory Charter 1 |
| **Fixed in** | build 1.4.0-rc.2 |
| **Reported by** | G. Silva (QA) |

## Preconditions
- Signed in as `alice.qa@example.com`
- Cart subtotal exactly on the volume threshold: 1 × 4K Monitor is too high, so 10 × USB-C Hub → **1000.00**
- Coupon `WELCOME10` (10%) available

## Steps to reproduce
1. Add 10 × USB-C Hub to the cart (subtotal 1000.00)
2. Go to checkout and apply coupon `WELCOME10`
3. Place the order

## Expected
Coupon and volume discount are both 10%. Policy: **discounts never stack and a tie is resolved in the coupon's favour** (the customer-facing rule promises the coupon they typed is honoured). `discountSource` should be `coupon`.

## Actual
`discountSource` came back as `volume`. The total was correct by luck (both are 10%), but the receipt attributed the discount to the wrong source — and the bug would produce a **wrong total** the moment the two rates differ.

## Root cause
The selection used a strict comparison:

```diff
- if (couponPercent > volumePercent && couponPercent > 0) {
+ if (couponPercent >= volumePercent && couponPercent > 0) {
```

At equal rates the coupon branch was skipped and the code fell through to volume.

## Fix & verification
- One-character fix (`>` → `>=`) in `calculateQuote`.
- **Regression test added** and now guarding it: `tests/unit/pricing.test.ts` → *"coupon wins the tie at equal percentages"*, plus the API-level assertion in `tests/api/checkout.api.spec.ts`.
- Verified by the reporter against the exact steps above.

## Notes
Classic boundary-of-a-comparison defect. It hid behind equal rates — the receipt attribution was the only visible symptom, which is exactly why the discount *source* is asserted, not just the total.
