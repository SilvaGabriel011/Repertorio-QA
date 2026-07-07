# 08 — Security Testing

> Abuse cases, not use cases. Nineteen tests that treat the system as an adversary would.
>
> **Where:** `tests/security` · **Tool:** Playwright · **Run:** `npm run test:security` · **Risks:** R2 (data exposure), R3 (credential attacks)

## 1. Before — design

Functional tests ask "does it do what it should?"; security tests ask "**can it be made to do what it shouldn't?**" — same system, inverted intent. The threat model is scoped to what a store like this actually risks, mapped to OWASP categories so coverage is enumerable rather than vibes:

| Threat (OWASP) | Abuse case | Tests |
| --- | --- | --- |
| Broken Access Control (A01) | Read another user's order / cart (IDOR, session isolation) | `auth.security` |
| Identification & Auth Failures (A07) | Brute force; account enumeration via error deltas | `auth.security` |
| Injection (A03) | SQLi / XSS / path-traversal strings through search | `input-hardening.security` |
| Security Misconfiguration (A05) | Missing hardening headers; framework fingerprinting; verbose errors | `headers.security` |
| Software & Data Integrity (A08) | Prototype pollution; oversized/malformed payloads | `input-hardening.security` |

Every test asserts a **specific, exploitable** failure, never a scanner's "informational" noise. The bar: could a named attacker do a named bad thing? If not, it is not in the suite.

## 2. During — execution

Runs in CI gate 2 alongside the functional suites, on every change — security regressions are as easy to introduce as functional ones (one forgotten `requireAuth` and R2 is live), so they are gated the same way. Fully parallel; the two stateful tests (throttling, enumeration) use per-run unique emails (`Date.now()`) so a lockout in one test can never poison another.

This is the automated *floor*, run continuously — not a substitute for periodic manual pentesting and dependency scanning. Its value is preventing the *known* regression on every commit, cheaply, so human review time is spent on the novel.

## 3. After — analysis

- **A security red is a stop-ship**, triaged above functional failures. `a user cannot read another user's order (IDOR)` going red is not a bug ticket — it is an incident rehearsal.
- **Exit criterion:** 19/19. Security tests do not get a "known failing" grace period; a tolerated security failure is a documented vulnerability with a green badge.
- **Maintenance rule:** every security finding — from pentest, bug bounty, or incident — becomes a permanent test here before the fix merges. The suite is the institutional memory of "attacks we have already survived", so we never re-open a closed hole.

## How it is applied here

| Decision | Where to see it |
| --- | --- |
| IDOR: Bob requesting Alice's order gets `404`, identical to a nonexistent id | `tests/security/auth.security.spec.ts` |
| Enumeration defence: wrong-password body ≡ unknown-user body | same file |
| Throttling: 6th failed login → `429` + `Retry-After` | same file |
| Session isolation: Bob's token never sees Alice's cart | same file |
| Injection strings return safe JSON, never reflected/executed | `tests/security/input-hardening.security.spec.ts` |
| Hardening headers present; `X-Powered-By` absent; errors are JSON | `tests/security/headers.security.spec.ts` |
| Oversized body → `413`; malformed JSON → `400`, not a crash | `tests/security/input-hardening.security.spec.ts` |

The 404-not-403 choice for IDOR is deliberate: a `403 Forbidden` confirms the resource *exists*, which is itself a leak. Returning `404` for "not yours" and "not real" alike tells an attacker nothing. That is a design decision the test *enforces*, not just observes.

## Field notes

- Automated security testing is a floor, not a ceiling. It stops the regression you already understand; it will not find the novel exploit — that is what you hire humans and time for.
- The most damaging bugs are boring: a missing ownership check, a `403` that should be a `404`, an error message one word too honest. Test the boring things relentlessly.
- Assert the *absence* of leakage as rigorously as the presence of function. "It returned data" and "it returned data it was allowed to" are different assertions, and only the second is security.
