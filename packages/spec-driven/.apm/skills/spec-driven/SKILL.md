---
name: spec-driven
description: "Spec-driven project methodology reference. Use when a project has a specs/ folder for managing product requirements, vision, architecture, success measures, decision records (ADR), optional glossary, and ticket-based work tracking. Loaded when: working on a project with specs/; reading or updating PRD, vision, architecture, or glossary; detecting drift between code and specs; reviewing project methodology or document formats. Triggers on: 'specs', 'PRD', 'vision', 'success metrics', 'milestones', 'architecture', 'ADR', 'decision record', 'glossary', 'ticket', 'project methodology', 'ground truth'."
---

# Spec-Driven Development

A lightweight entrypoint for a collaborative human-agent methodology where requirements, decisions, and work are documented in a `specs/` folder that serves as the project's single source of truth.

Read this skill first. Then load deeper references only when the current task needs them.

## Core Rules

1. **Specs are the ground truth.** When code and specs disagree, the specs win. Either update the code or create an ADR to change the specs.
2. **Major decisions are explicit.** Scope, architecture, and trade-off changes require human confirmation and, when appropriate, an ADR.
3. **Work stays traceable.** Tickets should explain not just WHAT changed, but WHY, including durable findings discovered during implementation and review.
4. **Document locally and progressively.** Create and update ticket-local documents as the work evolves. Do not wait until the end to capture material assumptions, frictions, or follow-up candidates.
5. **Surface drift immediately.** If implementation or review reveals disagreement between code and specs, call it out and resolve it instead of silently diverging.
6. **Keep shared entrypoints stable.** Avoid routine updates to project-level summary files. Derive current ticket state from ticket files instead of maintaining central status dashboards.

## Truth Hierarchy

When documents conflict, the higher-level document takes precedence:

```text
Vision.md > PRD.md > Architecture/ > Ticket Spec.md > Ticket Plan.md
```

If documents conflict, resolve it by either:

- creating an ADR and updating the higher-level document
- creating a ticket to fix the lower-level document or code

## Low-Conflict Write Policy

- Prefer ticket-local updates over project-level updates during normal work.
- Keep `specs/README.md` stable. It is navigation and orientation, not a live dashboard.
- Do not maintain active-ticket tables, recently completed tables, latest task summaries, or volatile update dates in project-level specs.
- Derive ticket status by scanning `specs/tickets/*/Spec.md` frontmatter.
- Avoid volatile metadata. Record stable lifecycle dates such as ticket creation and completion only.

## Minimal Document Map

- **Project-level docs** define the stable ground truth: `README.md`, `Vision.md`, `PRD.md`, `Architecture/`, and `decisions/`. `Glossary.md` is optional when domain vocabulary needs durable definitions.
- **`Vision.md`** carries the long-lived purpose and direction: vision, problem statement, target audience, success metrics, and milestones.
- **Ticket-level docs** capture the lifecycle of a work item: `Spec.md`, `Plan.md`, and optional supporting files such as `Research.md`, `Decisions.md`, and `Findings.md`.
- **`Spec.md`** is the ticket anchor. It carries ticket metadata, summary, user stories, acceptance criteria, and scope.
- **`Plan.md`** is required. It carries the implementation strategy, risks, and execution checklist.
- **`Findings.md`** is curated. Use it for durable implementation discoveries such as assumptions, frictions, workarounds, follow-up candidates, and residual risks. Every finding needs a disposition.

## Drift Detection

At the start of every conversation on a project with `specs/`:

1. Read `specs/README.md`, then `Vision.md`, `PRD.md`, and `Architecture/README.md`.
2. If the work touches entities, payloads, signals, public structs, APIs, or persisted read models, also read any existing architecture sub-documents that define the relevant long-lived boundaries.
3. If the current code or task contradicts these documents, **alert the user immediately**.
4. Resolution options:
   - create an ADR to update the specs if the code is right and the specs are outdated
   - create a ticket to fix the code if the specs are right and the code has drifted

## Read More Only When Needed

- [references/methodology.md](./references/methodology.md) — detailed document rules, lifecycle guidance, ADR policy, drift handling, and Findings guidance
- [references/templates.md](./references/templates.md) — document templates

## Use a concise and to the point writing style

Be respectful of the fact that the human needs to read, understand and approve the `spec` files.
Don't add unnecessary detail or verbosity.

## Which Skill Next?

- **Setting up specs** — load `specs-setup`, then read the methodology reference and templates as needed.
- **Creating or resuming a ticket** — load `specs-tickets`, then read the methodology reference and templates as needed.
- **Auditing the overall health of specs** — load `specs-review`, then read the methodology reference as needed.
- **Closing an implemented ticket** — load `specs-finish-ticket`, then read the methodology reference as needed.

This skill intentionally stays lightweight. Use the methodology reference when you need operational detail.
