#!/usr/bin/env bash
# Installed as /usr/local/bin/claude-debug-cmd and pinned to claude-debug's key via
# command="..." in authorized_keys. This allow-list is the security boundary: the `docker` group
# that lets it read container state is root-equivalent (`docker run -v /:/host` writes anywhere on
# the host), so nothing below may hand a caller-supplied string to a shell.
set -uo pipefail

refuse() {
  printf 'refused: %s\n' "${SSH_ORIGINAL_COMMAND:-<empty>}" >&2
  exit 77
}

command_line=${SSH_ORIGINAL_COMMAND:-}
[ -n "$command_line" ] || refuse

# Rejected before the verb is even looked at, so that a chained or redirected command can never
# reach the allow-list comparison below.
case $command_line in
  *[\;\&\|\<\>\`\$\(\)\{\}]* ) refuse ;;
  *$'\n'* | *$'\r'* ) refuse ;;
esac

read -r -a argv <<< "$command_line"

case "${argv[*]}" in
  "docker ps")                exec docker ps ;;
  "docker stats --no-stream") exec docker stats --no-stream ;;
  "free -m")                  exec free -m ;;
  "df -h")                    exec df -h ;;
esac

# `docker logs` is the only permitted command that takes arguments, so it is the only one whose
# arguments get validated rather than compared.
if [ "${#argv[@]}" -eq 5 ] \
   && [ "${argv[0]}" = docker ] && [ "${argv[1]}" = logs ] && [ "${argv[3]}" = --tail ]; then
  case ${argv[2]} in '' | *[!a-zA-Z0-9_.-]* ) refuse ;; esac
  case ${argv[4]} in '' | *[!0-9]* ) refuse ;; esac
  [ "${argv[4]}" -le 1000 ] || refuse
  exec docker logs "${argv[2]}" --tail "${argv[4]}"
fi

refuse
