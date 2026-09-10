---
name: verified-scout
description: Runs user-selected small-model repository scouting before expensive coding, verifies the handoff, routes work cheap-first, and stops unproductive loops. Use when a bug or feature location is unclear, repository exploration is needed, or an agent repeats actions without gaining evidence. Accepts scout_model=<runtime model ID>.
---

# Verified Scout

This workflow applies Scrouting (arXiv:2608.04804) and Agentic Abstention
(arXiv:2606.28733) to everyday coding work.

## When to use

Use it when the relevant files or root cause are unknown. Skip it when the task
is already localized and can be completed with one or two targeted edits.

## Select the scout model

Accept `scout_model=<runtime model ID>` from the user's invocation. Resolve the
model in this order:

1. The explicit `scout_model` value from the current request.
2. Default: `github-copilot/claude-haiku-4.5`, currently the lowest
   premium-request multiplier (0.33) among the user's available non-Microsoft
   GitHub Copilot models.
3. If the selected model is unavailable or fails with a retryable model error,
   retry once with the coordinator's current model.

Do not silently choose a different small model. After the scout completes,
report the requested model, the runtime-reported actual model, and whether the
fallback was used. Never infer the actual model from the skill text.

Example:

```text
/skill:verified-scout scout_model=github-copilot/claude-haiku-4.5 investigate the payment timeout
```

Agents without skill commands can express the same option in natural language:
"Use verified-scout with scout_model=<model ID>."

## Scout

Create an isolated, read-only scout phase with a budget of three to five
investigative turns. Pass the resolved scout model through the coding agent's
native subagent/model override.

If the agent cannot isolate or switch models, run the scout as a separate first
phase with the current model and state that no model routing occurred.

Require this handoff:

```yaml
status: located | uncertain | infeasible
implicated_files: []
diagnosis: ""
reproduction:
  command: ""
  expected_failure: ""
evidence: []
```

The scout must not edit files. It should return paths and executable evidence,
not a proposed patch.

## Verify then strip

Before handing work to a fixer:

1. Confirm each implicated path exists.
2. Run the reproduction command in the project environment.
3. Keep only claims supported by the command output or source reads.
4. Remove unsupported diagnosis and reproduction claims.
5. If nothing verifies, give the fixer only the original request.

## Transport the verified handoff

Serialize the verified handoff without changing its content. If it is 2,000
characters or fewer, keep it inline. If it is larger and the scout,
coordinator, and fixer share a filesystem:

1. Run `scripts/handoff_transport.py store --repository <repository-root>` with
   the full verified handoff on standard input, using an available Python 3
   interpreter. The dependency-free utility atomically stores at most 1 MiB in
   a repository-scoped namespace under the user's private cache and prints its
   absolute path. It uses `VERIFIED_SCOUT_CACHE_DIR` when set (the value must be
   an absolute path), then the platform's private user cache: `%LOCALAPPDATA%`
   on Windows, `~/Library/Caches` on macOS, or an absolute `$XDG_CACHE_HOME`
   with `~/.cache` as the Linux/other fallback. Harnesses should set
   `VERIFIED_SCOUT_CACHE_DIR` to an absolute path when they manage storage;
   users may also set it to choose a custom private cache location.
2. Give the fixer the original request plus only this transport envelope (never
   duplicate the full handoff in the prompt):

   ```yaml
   handoff_path: /absolute/path/printed/by/the/utility
   verification_status: verified | partially_verified | unverified
   summary:
     - up to five short verified facts
   ```

3. The fixer must not read the file preemptively. It may run
   `scripts/handoff_transport.py read --repository <repository-root>
   <absolute-path>` only when the original request, status, and summary are not
   sufficient for its next action.
4. After the fixer completes successfully, run
   `scripts/handoff_transport.py delete --repository <repository-root>
   <absolute-path>`. On failure or abstention, retain the file and report its
   absolute path so the owner can recover or delete it.

Confirm shared-filesystem availability before using a path. If the scout and
fixer do not share a filesystem, or if the private cache cannot be created,
keep the full handoff inline regardless of size and explicitly state that the
inline transport fallback occurred. Never fall back to a shared OS temporary
directory, and never ask a fixer on another filesystem to use a local path.

## Route cheap-first

Start with the cheapest capable fixer using the original request plus the
conditionally transported verified handoff. Escalate only after a verified
blocker or demonstrated lack of progress. When escalating, pass verified
artifacts and observations, not the weaker model's speculative reasoning. A
new fixer must receive either the inline handoff or a path accessible on its
filesystem under the same transport rules.

## Abstain

Treat `ABSTAIN` as a valid terminal outcome, alongside acting and answering.
Abstain only with concrete evidence. Stop when any condition holds:

- The same failure occurs twice without a new hypothesis or observation.
- Three consecutive actions produce no new evidence.
- Required dependencies, credentials, services, or source data are unavailable.
- The repository state cannot satisfy the stated acceptance criteria.
- The request is contradictory or remains materially underspecified after one
  focused clarification attempt.

Do not abstain merely because the task is difficult or unfamiliar. Report the
reason, evidence, actions attempted, and the smallest owner action that would
unblock the work.

## Runtime adapters

The workflow and handoff contract are portable. Runtime-specific routing is an
optional adapter:

- Pi/pi-crew: dispatch `explorer` with `model` set to the resolved
  `scout_model`. With Pi's fallback policy, a retryable failure falls back to
  the current parent model.
- Other coding agents: map `scout_model` to their native isolated-agent or model
  override. If no such capability exists, preserve the scout, verify, fix
  phases with the current model and report that routing was unavailable.

## Evolve stopping rules

After a confirmed wasted loop, distill one reusable stopping rule from the full
trajectory. Keep a short project playbook rather than accumulating raw session
summaries. Update it only with evidence from completed or reviewed work.
