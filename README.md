# cms-be-all

An original forum + CMS platform: boards, threads, posts, private messaging, social
groups, CMS pages, moderation, and more — built from scratch in TypeScript. See
[`docs/DATABASE.md`](docs/DATABASE.md) for the full data model and
[`docs/ROADMAP.md`](docs/ROADMAP.md) for what's built vs. planned.

## Stack

- **API**: NestJS + Prisma + PostgreSQL, JWT auth (access + refresh tokens), Argon2
  password hashing, Redis for caching/queues.
- **Web**: Next.js + React + Tailwind.
- **Infra**: Docker Compose (Postgres, Redis, MinIO, Mailpit, api, web), pnpm workspaces
  monorepo.
- **CI**: GitHub Actions — lint, typecheck, unit + e2e tests against real Postgres/Redis
  service containers, Docker build validation on every push; image publish to GHCR on
  `main`.

## Project layout

```
apps/api        NestJS backend
apps/web        Next.js frontend
packages/shared Shared TypeScript types used by both apps
docker/         Dockerfiles
docs/           Database design + roadmap
```

## Local development

Requires Node 20+, pnpm, and Docker.

```bash
cp .env.example .env
pnpm install                          # also builds packages/shared via postinstall

docker compose up -d postgres redis   # or the full stack: docker compose up -d

cp apps/api/.env.example apps/api/.env   # adjust DATABASE_URL if you changed ports
pnpm --filter @cms-be-all/api prisma:migrate
pnpm --filter @cms-be-all/api prisma:seed   # creates an admin user + a demo board

pnpm dev:api    # http://localhost:13001/api
pnpm dev:web    # http://localhost:3000
```

Seeded admin login: `admin` / value of `SEED_ADMIN_PASSWORD` (defaults to
`ChangeMe123!` — change this before seeding a real deployment).

## Running everything in Docker

```bash
docker compose up --build
```

This builds and runs Postgres, Redis, MinIO, Mailpit, the API, and the web app together.
Run migrations/seed once against the containerized Postgres the same way as above (point
`DATABASE_URL` at `localhost:${POSTGRES_PORT}`).

## Testing

```bash
pnpm --filter @cms-be-all/api test        # unit tests
pnpm --filter @cms-be-all/api test:e2e    # e2e tests (needs a running Postgres)
pnpm --filter @cms-be-all/web test        # frontend unit tests
pnpm lint
pnpm typecheck
```

CI runs all of the above automatically on every push/PR — see
[`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## License

MIT — see [`LICENSE`](LICENSE).
