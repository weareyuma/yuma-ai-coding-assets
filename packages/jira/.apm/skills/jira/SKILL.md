---
name: jira
description: Use this skill to interact with Jira Cloud through the official Atlassian CLI (acli), including searching, viewing, creating, and updating Jira work items.
---

# Jira

Use the official Atlassian CLI (`acli`) for all Jira operations.

## Setup

Before the first Jira operation in a session, run the bundled `scripts/check-setup.sh` script. Follow its instructions if setup is incomplete. Never ask the user to disclose an API token or print one in commands or output.

## Repository Project

Read the Jira project key from `.jira.json` at the Git repository root:

```json
{
	"projectKey": "ABC"
}
```

- If the file is absent, ask the user for the project key. Do not infer it.
- Validate the key with `acli jira project view --key "<projectKey>" --json`.
- After successful validation, ask for confirmation before creating `.jira.json`.
- Use the configured project for searches and work item creation.
- Do not operate across projects unless the user explicitly requests it.
- Store only `projectKey`; never store credentials or a 1Password item UUID in this file.

## Working with ACLI

- Discover commands and flags with `acli jira --help` and progressively nested `--help` commands. Do not rely on memorized syntax.
- Prefer JSON output when the discovered command supports it.
- Use the least destructive command that satisfies the request.
- Before every operation that creates, changes, transitions, comments on, assigns, archives, or deletes Jira data, show the exact intended action and ask the user for explicit confirmation.
- Execute a write only after receiving that confirmation. Read-only searches and views do not require confirmation.
- Never bypass an interactive confirmation flag until the user has approved the operation.
