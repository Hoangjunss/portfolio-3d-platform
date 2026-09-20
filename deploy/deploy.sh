#!/usr/bin/env bash
set -euo pipefail

cd /opt/portfolio-3d-platform

# IMAGE_TAG is written into .env by the deploy job. Pinning to a SHA is what makes rollback a
# one-liner instead of a rebuild from a source tree this host does not have.
docker compose pull
docker compose up -d --remove-orphans

# Fail the deploy loudly if the backend did not come back up, rather than leaving CI green over
# a crash-looping container.
for _ in $(seq 1 30); do
  if curl -fsS http://localhost/api/public/templates >/dev/null 2>&1; then
    docker image prune -f
    echo "deploy ok"
    exit 0
  fi
  sleep 5
done

echo "backend did not become healthy within 150s" >&2
docker compose logs --tail=100 backend >&2
exit 1
