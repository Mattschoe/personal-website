# Matt's personal site

A static personal site with three content streams — **Recipes**, **Projects**, and a **Blog** —
plus a Home page surfacing the latest of each. Built with Vite + React + TypeScript and prerendered
to static HTML with [`vite-react-ssg`](https://github.com/Daydreamer-riri/vite-react-ssg). Content is
plain Markdown committed to this repo. No runtime server, no database.

See [`SPEC.md`](./SPEC.md) for the design contract, [`PLAN.md`](./PLAN.md) for the build phases, and
[`CLAUDE.md`](./CLAUDE.md) / [`AGENTS.md`](./AGENTS.md) for the build conventions.

## Local development

```bash
npm install
npm run dev        # dev server
npm run build      # prerender static site to dist/
npm run preview    # serve the built dist/ locally
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run test       # vitest
```

## Adding content

This is the whole point — **no code changes required**:

1. Drop a Markdown file into the right folder:
   - `content/blog/<slug>.md`
   - `content/recipes/<slug>.md`
   - `content/projects/<slug>.md`
2. Fill in the front-matter (see existing files / `SPEC.md` §9 for the fields).
3. Commit and push to `main`.

The next pipeline run prerenders the new page, regenerates the Home "Latest" feed, sitemap, and RSS,
and builds a fresh image. The VPS picks it up within ~5 minutes — the post is live with no manual steps.

## Deployment

Deployment is **pull-based**: CI only builds and publishes the image to GHCR; the VPS pulls it itself
via `podman-auto-update`. CI never connects to the VPS, so no inbound SSH (or firewall opening) is
needed.

```
push to main
  └─ GitHub Actions (.github/workflows/deploy.yml)
       └─ build-test-push: npm ci → typecheck → lint → test
                           → build image → push to ghcr.io/mattschoe/personal-website:latest

VPS (rootless Podman, user `mattschoe`)
  └─ podman-auto-update.timer (every 5 min)
       └─ podman auto-update: new :latest digest? → pull → restart the unit
                              (rolls back to the previous image if it fails health)
```

On the VPS the image runs as a **Quadlet systemd unit** ([`deploy/personal-website.container`](./deploy/personal-website.container))
under **rootless Podman**, behind the existing **Traefik** stack. Traefik terminates TLS and routes
`mattschoe.dev` to the container over the external `traefik-net` network (entrypoint `websecure`,
certresolver `myresolver`). The container itself is plain nginx serving the prerendered `dist/` on
port 80 — see [`Dockerfile`](./Dockerfile) and [`nginx.conf`](./nginx.conf).
([`docker-compose.yml`](./docker-compose.yml) is kept for local runs only, not for production.)

### GitHub secrets

None required for deployment. `GITHUB_TOKEN` is provided automatically and is used to push the image
to GHCR. (The old `VPS_HOST` / `VPS_USER` / `VPS_SSH_KEY` / `VPS_SSH_PORT` secrets are no longer used
and can be deleted.)

### One-time VPS setup

Run as `mattschoe` on the VPS. Requires Podman ≥ 4.4 (Quadlet); health-based rollback needs ≥ 5.0
(otherwise drop the `Notify=healthy` line from the unit — see its comment).

1. Make the GHCR package **`personal-website` Public** (Packages → Package settings) so pulls need no
   auth. *(To keep it private instead: `podman login ghcr.io -u mattschoe` with a `read:packages` PAT
   so `podman auto-update` has credentials.)*
2. Stop any old compose-managed container: `cd ~/projects/personal-website && podman compose down`.
3. Install the unit and the 5-minute timer override:
   ```bash
   mkdir -p ~/.config/containers/systemd ~/.config/systemd/user/podman-auto-update.timer.d
   cp deploy/personal-website.container          ~/.config/containers/systemd/
   cp deploy/podman-auto-update.timer.d/override.conf \
      ~/.config/systemd/user/podman-auto-update.timer.d/
   ```
4. Enable lingering so user services run without a login session: `loginctl enable-linger mattschoe`.
5. Load and start everything:
   ```bash
   systemctl --user daemon-reload
   systemctl --user start personal-website.service
   systemctl --user enable --now podman-auto-update.timer
   ```
6. Point DNS for `mattschoe.dev` at the VPS, then check `https://mattschoe.dev` loads.

**Force a deploy now** (skip the ≤5-min wait): `systemctl --user start podman-auto-update.service`.

### Local image check

```bash
podman build --build-arg VITE_SITE_URL=https://mattschoe.dev -t pw-test .
podman run --rm -p 8080:80 pw-test
# then visit http://localhost:8080
```
