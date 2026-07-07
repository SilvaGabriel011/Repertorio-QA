# 02 — Contract Testing

> Consumer and provider agree on a machine-verified contract, so integration breaks are caught without an integrated environment.
>
> **Where:** `tests/contract` · **Tool:** Pact (consumer-driven) · **Run:** `npm run test:contract` · **Risk:** R4 (client/API drift)

## 1. Before — design

The failure mode this scope targets is silent drift: the API team renames `priceCents`, the storefront renders `undefined`, and nobody's suite went red because each side tested against its own assumptions. E2E would catch it — late, expensively, and flakily. A contract catches it at build time on whichever side moved first.

Design decisions:

- **Consumer-driven.** The storefront (`storefront-web`) states what it actually uses; the API (`qa-store-api`) must honour exactly that. The contract covers the fields the consumer reads — no more. Provider fields nobody consumes stay free to change, which is the point: contracts should constrain as little as possible while still preventing breakage.
- **Shapes, not values.** Matchers (`eachLike`, `like`, `regex`) pin structure and types; pinning concrete values would turn every catalog edit into a false alarm.
- **Error shapes are contract too.** The 404 body and the 401 body are part of the agreement — the storefront's error handling depends on `{ "error": "<code>" }` as firmly as its happy path depends on `token`.

Four interactions: product list, missing product, valid login, rejected login.

## 2. During — execution

Two phases, strictly ordered (`fileParallelism: false` in `vitest.config.ts`):

1. **Consumer side** — each test runs the real client code (plain `fetch`) against a Pact mock provider; passing tests emit `pacts/storefront-web-qa-store-api.json`.
2. **Provider verification** — a real app instance boots on an ephemeral port and Pact replays every recorded interaction against it, comparing status, headers and body shape.

In this repo both halves live in one codebase, so the pact file travels by filesystem. Across real teams the same flow runs through a Pact Broker: consumers publish on merge, providers verify on their own pipeline, and `can-i-deploy` answers the only question that matters before a release. The mechanics here are identical, minus the broker.

State handlers (`the catalog is seeded`, `user alice.qa@example.com exists`) are no-ops because seed data is baked into the SUT — but they are declared, because in any real provider they are where test data gets provisioned per interaction.

## 3. After — analysis

- **Exit criterion:** both directions green — consumer expectations recorded *and* provider honouring every interaction.
- A provider-side failure reads precisely: *which interaction*, *which field*, expected vs. actual. Triage is minutes, not the archaeology an integrated-environment failure demands.
- **Maintenance rule:** a contract change is a conversation, not a commit. The consumer adds the expectation first (provider verification goes red), then the provider implements. The red build *is* the conversation happening in the right order.

## How it is applied here

| Decision | Where to see it |
| --- | --- |
| Structure matchers over literal bodies | `tests/contract/consumer.pact.test.ts` |
| Token format pinned by regex, not value | login interaction — any UUID passes, `"abc"` never will |
| Provider verified as a real process over HTTP | `tests/contract/provider.pact.test.ts` — `createApp().listen(0)` |
| Proxy env stripped for localhost verification | same file — corporate proxies must not intercept the verifier |

## Field notes

- Contract tests replace *integration* tests, not *functional* ones. Pact proves the two sides can talk; whether the conversation makes business sense is the API suite's job.
- Resist pinning everything "to be safe" — an over-specified contract is a distributed monolith with extra steps. Every matcher you add is a freedom you take from the provider.
- The verification failure you ignore today is the production incident of the week the other team deploys.
