#!/usr/bin/env bash
set -euo pipefail

cd /opt/portfolio-3d-platform

# GHCR packages are private by default, so `pull` is a 401 without this. The token is the job's
# own GITHUB_TOKEN, passed in by the workflow and dead by the time the job ends -- deliberately
# not a long-lived PAT sitting in ~/.docker/config.json on the VPS.
echo "${GHCR_TOKEN:?passed in by the deploy workflow}" \
  | docker login ghcr.io -u "${GHCR_USER:?passed in by the deploy workflow}" --password-stdin
trap 'docker logout ghcr.io >/dev/null 2>&1 || true' EXIT

# IMAGE_TAG is read from the .env the deploy job uploaded. Pinning to a SHA is what makes rollback
# a one-liner instead of a rebuild from a source tree this host does not have.
docker compose pull
docker compose up -d --remove-orphans

# Ask the site the way a browser does. Port 80 only returns 301 since plan 16, and `curl -fsS`
# exits 0 on a 301 -- which is how this loop used to report success over a dead backend (AD-01).
# --resolve (not -H 'Host:') so curl sends the right SNI and the wildcard cert verifies, and so
# routing does not depend on conf.d's alphabetical order (AC-03). An expired cert failing the
# deploy is intended: at that point the site is already broken for every browser, and plan 13's
# Secure cookies stop working (Z-18).
# /api/public/templates is permitAll, is not rate-limited, and returns 200 [] on an empty DB.
# Redis has no volume, so its cache is cold after every `up -d` and the first call reaches
# Postgres -- a 200 here means nginx, Spring, Redis, Postgres and Flyway are all up.
for _ in $(seq 1 30); do
  if curl -fsS --resolve api.portfolio.com:443:127.0.0.1 \
          https://api.portfolio.com/api/public/templates >/dev/null 2>&1; then
    docker image prune -f
    echo "deploy ok"
    exit 0
  fi
  sleep 5
done

echo "stack did not become healthy within 150s" >&2
docker compose logs --tail=100 backend >&2
docker compose logs --tail=50 nginx >&2
exit 1
