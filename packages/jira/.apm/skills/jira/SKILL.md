---
name: jira
description: Use this skill to interact with Jira Cloud through the official Atlassian MCP, including searching, viewing, creating, and updating Jira work items.
---

# Jira

Use the Atlassian MCP for all Jira operations. If the user asks you to perform Jira actions but you do not have access to the Atlassian MCP tools, ask the user to enable the MCP server and complete the authentication process.

## Repository Project

Read the Jira project key from `.jira.json` at the Git repository root:

```json
{
  "projectKey": "ABC"
}
```

- If the file is absent, ask the user for the project key. Do not infer it.
- Validate the key with the Atlassian MCP tools.
- After successful validation, ask for confirmation before creating `.jira.json`.
- Use the configured project for searches and work item creation.
- Do not operate across projects unless the user explicitly requests it.

## Working with Jira

- Use the least destructive command that satisfies the request.
- Before every operation that creates, changes, transitions, comments on, assigns, archives, or deletes Jira data, show the exact intended action and ask the user for explicit confirmation.
- Execute a write only after receiving that confirmation. Read-only searches and views do not require confirmation.
- Never bypass an interactive confirmation flag until the user has approved the operation.
