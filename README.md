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
builds a fresh image, and deploys it. The post is live with no manual steps.

## Deployment

CI builds a Docker image and the VPS pulls it — the source tree never lands on the host.

```
push to main
  └─ GitHub Actions (.github/workflows/deploy.yml)
       ├─ build-test-push: npm ci → typecheck → lint → test
       │                   → build image → push to ghcr.io/mattschoe/personal-website
       └─ deploy: SCP docker-compose.yml to the VPS
                  → SSH: podman compose pull && up -d
```

On the VPS the image runs under **rootless Podman** behind the existing **Traefik** stack. Traefik
terminates TLS and routes `mattschoe.dev` to the container over the external `traefik-net` network
(entrypoint `websecure`, certresolver `myresolver`). The container itself is plain nginx serving the
prerendered `dist/` on port 80 — see [`Dockerfile`](./Dockerfile), [`nginx.conf`](./nginx.conf), and
[`docker-compose.yml`](./docker-compose.yml).

### Required GitHub secrets

| Secret         | Description                                                            |
| -------------- | --------------------------------------------------------------------- |
| `VPS_HOST`     | VPS hostname or IP                                                     |
| `VPS_USER`     | SSH user (`mattschoe`) — owns `~/projects/personal-website`           |
| `VPS_SSH_KEY`  | Private SSH key whose public half is in the VPS `authorized_keys`     |
| `VPS_SSH_PORT` | Optional — SSH port if not `22`                                        |

`GITHUB_TOKEN` is provided automatically and is used to push the image to GHCR.

### One-time setup

- Add the secrets above (Settings → Secrets and variables → Actions).
- After the first successful run, set the GHCR package
  **`personal-website` visibility to Public** (Packages → Package settings) so the VPS pulls without
  authenticating.
- On the VPS: ensure `~/projects/personal-website/` exists and that rootless-podman lingering is on
  (`loginctl enable-linger mattschoe`) so the container survives logout. Point DNS for
  `mattschoe.dev` at the VPS.

### Local image check

```bash
podman build --build-arg VITE_SITE_URL=https://mattschoe.dev -t pw-test .
podman run --rm -p 8080:80 pw-test
# then visit http://localhost:8080
```
