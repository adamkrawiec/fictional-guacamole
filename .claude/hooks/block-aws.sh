#!/usr/bin/env bash
# Blocks any Bash command that runs the AWS CLI.
cmd=$(jq -r '.tool_input.command // empty')

# Matches the tool only in command position: at the start, or after ; & | ( `
# optionally behind env assignments (FOO=1), sudo/env/exec/time/nohup/command/xargs,
# or a path (/opt/homebrew/bin/...). A word inside arguments, e.g. a commit message, is not matched.
# POSIX classes only, so it works with macOS grep.
prefix='(^|[;&|(`])[[:space:]]*(([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*|sudo|exec|time|nohup|command|env|xargs)[[:space:]]+)*([^[:space:];&|]*/)?'
tool='(aws)'
suffix='([[:space:];&|)`]|$)'
if printf '%s' "$cmd" | grep -Eq "${prefix}${tool}${suffix}"; then
  echo "Blocked: running the AWS CLI is not allowed in this project. Give the user the command to run themselves." >&2
  exit 2
fi
exit 0
