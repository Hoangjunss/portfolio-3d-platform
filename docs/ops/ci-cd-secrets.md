# CI/CD Secrets

Repository secrets required by `.github/workflows/deploy.yml`.

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
  the frontend image, and in the VPS `.env`. Both must agree.

## Mail (optional)
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`. Leaving these unset means lead
notification emails are silently dropped while the leads themselves still save.

`GITHUB_TOKEN` needs no setup — Actions provides it, and the `build` job's
`permissions: packages: write` is what lets it push to GHCR.

## Rollback
Images are tagged by commit SHA. To roll back, SSH to the VPS and run:

    cd /opt/portfolio-3d-platform
    sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=<previous-sha>/" .env
    docker compose up -d

## Manual operations (certificates and Nginx config)
- **Wildcard TLS certificates:** Issuance and renewal for `*.portfolio.com` are a manual DNS-01 procedure that this pipeline does not perform. Certificates live in `/opt/portfolio-3d-platform/nginx/certs/` outside the container and outside this workflow.
- **Nginx configuration:** `nginx/conf.d/` and certificates are not copied by this workflow (they change rarely and contain private keys). Changing an Nginx config is a manual step on the VPS.
