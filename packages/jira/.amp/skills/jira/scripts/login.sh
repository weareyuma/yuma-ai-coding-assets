#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <1password-item-uuid>" >&2
  exit 2
fi

if ! command -v op >/dev/null 2>&1; then
  echo "Error: 1Password CLI (op) is not installed." >&2
  exit 1
fi

if ! command -v acli >/dev/null 2>&1; then
  echo "Error: Atlassian CLI (acli) is not installed." >&2
  exit 1
fi

item_id="$1"
email=""
token=""
trap 'unset email token' EXIT

email="$(op item get "$item_id" --fields username --reveal)"
token="$(op item get "$item_id" --fields password --reveal)"

if [[ -z "$email" || -z "$token" ]]; then
  echo "Error: the 1Password Login item must contain a username and password." >&2
  exit 1
fi

printf '%s' "$token" | acli jira auth login \
  --site 'ops.jira.weareyuma.com' \
  --email "$email" \
  --token

acli jira auth status