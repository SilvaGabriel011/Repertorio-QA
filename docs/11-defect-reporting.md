# 11 — Defect Reporting

> A defect is worth exactly as much as the report that carries it. This is how a bug becomes an artifact that gets fixed fast and never returns.

The same three-lens method applies to a single bug: **before** you write (isolate and reproduce), **during** (the report itself), **after** (verify and prevent recurrence).

## 1. Before writing — isolate and reproduce

Before a word is written, three things must be true. Skipping any of them ships a report that bounces back:

1. **Reproduced deterministically** — a defect you can only trigger sometimes is a defect you cannot verify fixed. Find the *minimal* sequence that triggers it every time.
2. **Isolated to the smallest input** — strip everything incidental. "The whole flow breaks" is a rumour; "`WELCOME10` on a 300.00 cart returns 270.00 instead of 295.00" is a bug.
3. **Located to a layer** — does the API test reproduce it, or only the UI? That single question decides whether it is a back-end defect or a rendering one, and it is answerable in one command because the scopes are separated (see [03 — API Testing](03-api-testing.md)).

## 2. During — the report

The anatomy below is non-negotiable. Every field removes one round-trip between reporter and fixer:

```markdown
**Title:** [Checkout] Coupon on a threshold order is not re-adding shipping

**Severity:** High   **Priority:** High
**Environment:** main @ <commit>, Node 22, Chromium
**Component:** src/domain/pricing.ts

**Preconditions:**
- Signed in as alice.qa@example.com
- Cart: 1 × HD Webcam (300.00), subtotal on the free-shipping threshold

**Steps to reproduce:**
1. Go to checkout
2. Enter coupon WELCOME10 (10%)
3. Place the order

**Expected:** discount 30.00 drops the total below 300.00, so the
25.00 shipping fee returns → total 295.00

**Actual:** total shown as 270.00; shipping stayed free

**Evidence:** Playwright trace + confirmation screenshot attached

**Scope of impact:** every coupon that crosses the free-shipping
threshold downward — silent revenue loss on shipping

**Notes:** reproduces at API level (POST /api/checkout), so it is a
domain bug, not a rendering bug
```

### The fields that matter most

- **Severity vs. Priority** — severity is *impact if it happens* (technical), priority is *how soon we fix it* (business). A cosmetic typo on the landing page can be low severity, high priority. Conflating them is the most common triage failure.
- **Expected vs. Actual** — both, explicitly, with the *reasoning* for expected. "It's wrong" is not a bug report; "it's X, should be Y because Z" is.
- **Scope of impact** — turns "a bug" into "a business decision". This is what lets a product owner prioritise without re-deriving the consequences themselves.
- **Evidence** — trace, screenshot, logs. In this repo the artifacts are automatic on failure (`playwright.config.ts`), so the report half-writes itself.

## Severity rubric

Consistency beats cleverness — the same rubric every time so severity means the same thing to everyone:

| Severity | Definition | Example in this system |
| --- | --- | --- |
| **Critical** | Data loss/exposure, or core flow fully blocked | IDOR exposing another user's order; checkout down |
| **High** | Wrong result on a core flow; no safe workaround | Wrong order total; broken login for valid users |
| **Medium** | Feature impaired; workaround exists | Search ignores a valid query; confusing error copy |
| **Low** | Cosmetic; no functional impact | Misaligned button; imperfect empty state |

## 3. After — verify and prevent

A fix is not done when the code changes. It is done when:

1. **The reporter verifies** against the exact steps — the person who found it confirms it is gone. Author-verified fixes are how bugs reopen.
2. **A regression test is added at the lowest catching layer** — this is the standing rule of the whole portfolio. The threshold bug above earns a *unit* test (BVA-4), not just a UI one, because the domain is where it lived and unit is where it is cheapest to keep out.
3. **Escape analysis** — if it reached production or a high scope, ask *why the lower nets missed it*, and close that hole too. A defect that escaped is also a defect in the test strategy.

This is the loop that connects every document in the repo. [Exploration](10-test-case-catalog.md) finds the defect; a clean report carries it; the fix lands with the test that makes the fix permanent; the [pyramid](00-test-strategy.md) keeps it from ever coming back.

## Field notes

- Write the report for the person who will fix it at 5pm on a bad day: no context, no patience, needs to reproduce in under a minute. Optimise for their time, not yours.
- The bug you cannot reproduce is not ready to report — it is ready to *investigate*. Filing it anyway just moves the investigation onto someone with less context.
- Every escaped defect is free test-design feedback. The question is never only "how do we fix it?" but "why did our nets let it through?" — the second question is what makes the strategy get better instead of just bigger.
