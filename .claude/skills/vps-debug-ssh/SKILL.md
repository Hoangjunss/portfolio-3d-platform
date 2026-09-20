---
name: vps-debug-ssh
description: Use when the user asks to check production VPS health/logs for the portfolio platform (container status, RAM/disk usage, recent container errors) — read-only diagnostics only, never deploy or config changes.
---

# VPS Debug SSH (read-only)

Connects as `claude-debug` using a dedicated key, separate from the CI/CD `deploy` key (plan 17).

## What actually enforces "read-only"

`/usr/local/bin/claude-debug-cmd`, pinned to the key by `command="..."` in `authorized_keys`.
Anything outside its allow-list is refused by the VPS with `refused: <command>` on stderr and
**exit code 77**.

`claude-debug` is in the `docker` group, and **the `docker` group is root-equivalent** — a member
who reaches a real shell can write any file on the host via `docker run -v /:/host`. The group is
there because the wrapper needs it. The wrapper is the boundary; this document is not. Adding a
line to the allow-list is a privilege decision, not a documentation change.

## Permitted commands

Exactly these, byte for byte:

- `docker ps`
- `docker stats --no-stream`
- `docker logs <container> --tail <n>` — `<container>` matching `[A-Za-z0-9_.-]+`, `<n>` ≤ 1000
- `free -m`
- `df -h`

Shell metacharacters (`; & | < > ` $ ( ) { }`) and newlines are refused before the command is
matched, so commands cannot be chained.

## Not permitted — and refused by the VPS, not by convention

`docker compose` anything, `docker exec`, `docker restart`, `docker run`, file writes, `sudo`,
interactive shells, port/agent forwarding. All of these return exit 77.

## Usage

    ssh -i ~/.ssh/claude_debug_key claude-debug@<vps-host> "docker logs portfolio-3d-platform-backend-1 --tail 200"

Each invocation still goes through the normal tool-approval flow. Exit 77 means the wrapper
refused the command — do not try to work around it; ask the operator.
