# 00 — Test Strategy

> The whole portfolio follows one method. This document states it once; every other document applies it.

## The Cartesian method, applied to testing

Descartes' *Discourse on the Method* gives four precepts. After a decade of testing software, I have not found a better skeleton for a quality strategy:

| Precept | In Descartes' words (paraphrased) | In testing terms |
| --- | --- | --- |
| **1. Evidence** | Accept nothing as true that is not evidently so | Nothing is "done" without observable proof. "It works on my machine" is a hypothesis, not a result. Every claim in this repo is backed by an executable check. |
| **2. Analysis** | Divide each difficulty into as many parts as needed | "Is the product good?" is untestable. Divided into ten scopes, each answers exactly **one** question (see the scope map in the README). A test that answers two questions is two tests badly merged. |
| **3. Synthesis** | Order thoughts from the simplest to the most complex | The pyramid is an *ordering*, not a diagram: domain rules → contracts → API → UI flows → whole journeys → non-functional. Cheap, precise suites run first and veto the expensive, blurry ones. |
| **4. Enumeration** | Make reviews so complete that nothing is omitted | Coverage is enumerated deliberately: risk register, boundary tables, decision tables, traceability from test case to automated spec. What is *not* tested is stated, not hidden. |

## The three lenses: before, during, after

Every scope in this portfolio is examined through the same three lenses. This is the second axis of the method — the first divides the *system*, this one divides *time*:

- **Before — design.** What risk justifies this scope's existence? What are the entry criteria, the test data strategy, the techniques used to derive cases? Thinking happens here; execution only reveals whether the thinking was right.
- **During — execution.** How does the suite actually run — locally, in CI, in what order, with what isolation? What does a healthy run look like, and what evidence does it leave behind?
- **After — analysis.** Exit criteria: when is the result trustworthy? Who reads the output, what metrics matter, how are failures triaged, and what keeps the suite from rotting?

Every scope document (01–09 and 12) is structured as exactly these three sections. Test cases in the [catalog](10-test-case-catalog.md) follow the same split: preconditions → steps → expected result. So does [defect reporting](11-defect-reporting.md): isolate → write → verify. One mental model, applied recursively.

## Risk register (what drives priority)

The system under test is a store. Money and access are where it can hurt; priorities follow:

| # | Risk | Severity | Scopes that buy it down |
| --- | --- | --- | --- |
| R1 | An order is priced wrong (discount, shipping, rounding) | Critical | Unit (exhaustive boundaries), Integration, API, Regression |
| R2 | A user reads another user's data | Critical | Security (IDOR), Integration (session isolation) |
| R3 | Credentials can be brute-forced or enumerated | High | Security (throttling, generic errors) |
| R4 | Client and API drift apart and break the storefront | High | Contract |
| R5 | A broken build wastes the whole pipeline's time | Medium | Smoke (fail fast) |
| R6 | A purchase cannot be completed at all | Critical | E2E, Smoke |
| R7 | The service degrades under normal or sudden traffic | Medium | Load |
| R8 | The UI excludes users (WCAG failures) | Medium | Accessibility |

Every automated test in this repo traces back to one of these rows. A test that maps to no risk is decoration and gets deleted.

## Quality gates

Ordering precept applied to the pipeline — four gates, each one cheaper and more precise than the next, each able to veto everything after it. Encoded identically on **GitHub Actions** and **Jenkins** ([14 — CI/CD](14-cicd-pipelines.md)), because the bar lives in the strategy, not the tool:

| Gate | Suites | Typical duration | Vetoes |
| --- | --- | --- | --- |
| 1 | typecheck, unit, integration, contract | seconds | everything |
| 2 | smoke → api, security, a11y, regression, e2e | ~1 min | gates 3–4 |
| 3 | BDD (Cucumber) | seconds | gate 4 |
| 4 | load baseline (k6) | ~1 min | release |

Stress and spike load scenarios run on demand, not per commit — their job is capacity planning, not regression detection.

## Deliberate exclusions

Enumeration includes naming what is *out*:

- **Visual regression** — the UI is a test harness, not a brand asset; pixel diffs would assert nothing anyone decided.
- **Cross-browser matrix** — the portfolio's point is method; Chromium suffices to demonstrate it. Adding engines is config, not thinking.
- **Chaos/resilience** — a single in-memory process has no partitions to survive. Wrong system for that scope.

## How to read the rest

Docs 01–09 (plus **12 — Integration**) are the test scopes, in pyramid order — simplest first. **13 — BDD** and **14 — CI/CD** are practice and process, not new rungs: they change how the pyramid is *driven* and *gated*, not what it contains. **10** and **11** are the tool-agnostic craft (test design, defect handling). Each doc is self-contained, ~5 minutes, and ends with field notes: the judgment calls a checklist cannot give you.

What testing *produces* — filled-in defect reports, a cycle sign-off, quality telemetry — lives in [`../reports`](../reports/README.md).
