#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
AUTH_REFERENCE="${SKILL_DIR}/references/authentication.md"

if ! command -v acli >/dev/null 2>&1; then
  cat >&2 <<'EOF'
Atlassian CLI (acli) is not installed.

Install it using the official instructions:
https://developer.atlassian.com/cloud/acli/guides/install-acli/

After installation, rerun this setup check.
EOF
  exit 1
fi

if ! acli jira auth status >/dev/null 2>&1; then
  cat >&2 <<EOF
Atlassian CLI is not authenticated for Jira.

Follow the authentication instructions in:
${AUTH_REFERENCE}

After authentication, rerun this setup check.
EOF
  exit 1
fi

echo "Atlassian CLI is installed and authenticated for Jira."