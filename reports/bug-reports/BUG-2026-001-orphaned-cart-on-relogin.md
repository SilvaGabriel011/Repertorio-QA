# BUG-2026-001 — Cart is orphaned when a user logs in again

| Field | Value |
| --- | --- |
| **Status** | 🔲 Open (accepted, backlog) |
| **Severity** | Medium (data loss on a non-primary path + unbounded memory) |
| **Priority** | Medium |
| **Component** | `src/api/store.ts` (`cartFor`) |
| **Found in** | Cycle 42 · integration testing |
| **Reported by** | G. Silva (QA) |

## Preconditions
- Valid account `alice.qa@example.com`

## Steps to reproduce
1. Log in → receive token **A**
2. `POST /api/cart` with token A (add 1 × Mechanical Keyboard)
3. Log in again with the same credentials → receive token **B**
4. `GET /api/cart` with token B

## Expected
The cart belongs to the **user**; signing in again shows the item added in step 2.

## Actual
The cart returned for token B is **empty**. The cart from token A is unreachable and never freed.

## Root cause
Carts are keyed by session token, not by user id:

```js
cartFor(token) { /* one cart per token */ }
```

Each login mints a fresh token, so a re-login silently abandons the previous cart. Two consequences:
1. **UX:** a user who re-authenticates (new device, expired tab) loses their cart.
2. **Resource:** abandoned carts accumulate in memory with no eviction — a slow leak under real traffic.

## Impact / scope
Any user who logs in more than once. No workaround from the UI. Low blast radius today (in-memory demo), but it is a latent leak and a data-loss path, hence accepted rather than deferred silently.

## Recommendation
Key carts by `userId`, or persist the cart and rehydrate on login. Proposed regression to add on fix:

```
it('preserves the cart across a re-login', ...) // tests/integration
```

## Notes
Surfaced by integration testing precisely because it is a *cross-request, multi-session* behaviour — invisible to a unit test and easy to miss in a single-session UI walkthrough.
