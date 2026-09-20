# CI/CD Secrets

Repository secrets required by `.github/workflows/deploy.yml`.

## VPS prerequisites (one-time, manual)

Before the first deploy, as root on the VPS:

    adduser --disabled-password --gecos "" deploy
    usermod -aG docker deploy
    mkdir -p /opt/portfolio-3d-platform
    chown deploy:deploy /opt/portfolio-3d-platform

`curl` and `docker compose` v2 must be installed — `deploy/deploy.sh` health-checks with
`curl --resolve` and the pipeline never installs anything.

`nginx/conf.d/` and `nginx/certs/` are **not** copied by the workflow; put them in place by hand
(see "Manual operations" below). Nginx will not start without the certificates, and the deploy
will correctly fail if it does not start.

No `docker login` is needed by hand: the `deploy` job passes its own short-lived `GITHUB_TOKEN`
(hence `permissions: packages: read`) and `deploy/deploy.sh` logs in and out around the pull.

## Current state (2026-09-20)

Set, generated with `openssl rand -base64 32`: `DB_PASSWORD`, `JWT_ACCESS_SECRET`,
`ANALYTICS_IP_HASH_SECRET`. GitHub secrets are write-only, so these values cannot be read back
from the repository -- after the first deploy they are readable on the VPS in
`/opt/portfolio-3d-platform/.env`. Overwrite any of them with `gh secret set <NAME>` if you would
rather use your own.

**Still missing, and the `build` job stays red until they exist:** `PUBLIC_API_BASE_URL`,
`VPS_HOST`, `VPS_DEPLOY_SSH_KEY`. Each needs a real-world fact -- the API's public domain and the
VPS itself -- so none of them can be generated.

Note that `nginx/conf.d/` uses `portfolio.com` as a placeholder. `PUBLIC_API_BASE_URL` must match
the `server_name` in `api.conf` and the certificate in `nginx/certs/`; if the real domain differs,
the Nginx configs need the same edit.

## Deployment target
- `VPS_HOST` — the VPS's public IP or hostname.
- `VPS_DEPLOY_SSH_KEY` — private key for the dedicated `deploy` Linux user. Distinct from
  plan 18's `claude-debug` key: this one may run `docker compose`, that one may only read
  logs and status.

## Application secrets
Generate each with `openssl rand -base64 32`. The backend refuses to start in the `prod`
profile if any still holds its development default (plan 15's `SecretsGuard`).

- `DB_PASSWORD`
- `JWT_ACCESS_SECRET`
- `ANALYTICS_IP_HASH_SECRET` — keyed hash for `analytics_events.ip_hash`. Anyone holding it
  can reverse every stored IP hash.
- `PUBLIC_API_BASE_URL` — e.g. `https://api.portfolio.com`. Used **twice**: as a build arg for
  the frontend image, and in the VPS `.env`. Both must agree. The `build` job now fails when it is empty.

## Mail (optional)
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`. Leaving these unset means lead
notification emails are silently dropped while the leads themselves still save.

`GITHUB_TOKEN` needs no setup — Actions provides it. The `build` job needs
`permissions: packages: write` to push to GHCR, and the `deploy` job additionally needs
`permissions: packages: read` to pull.

## Rollback
Images are tagged by commit SHA. To roll back, SSH to the VPS and run:

    cd /opt/portfolio-3d-platform
    sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=<previous-sha>/" .env
    docker compose up -d

## Manual operations (certificates and Nginx config)
- **Wildcard TLS certificates:** Issuance and renewal for `*.portfolio.com` are a manual DNS-01 procedure that this pipeline does not perform. Certificates live in `/opt/portfolio-3d-platform/nginx/certs/` outside the container and outside this workflow.
- **Nginx configuration:** `nginx/conf.d/` and certificates are not copied by this workflow (they change rarely and contain private keys). Changing an Nginx config is a manual step on the VPS.
