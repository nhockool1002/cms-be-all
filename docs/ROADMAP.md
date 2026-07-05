# Roadmap

Phases 0–8 (monorepo scaffold, Docker, Identity & Access, Forum Core, CI/CD, frontend
redesign, initial publish, Social) are implemented. The remaining domains from
[`DATABASE.md`](./DATABASE.md) are future work, each following the module pattern
established by `apps/api/src/forum/` (a `*.module.ts` + `*.service.ts` +
`*.controller.ts` + `dto/` + `*.spec.ts`, plus a Prisma migration adding that domain's
tables):

- ~~**Phase 8 — Social**: private messaging (conversations/messages), social groups,
  profile comments, follows.~~ *(done — `apps/api/src/social/`)*
- **Phase 9 — CMS pages**: pages, versioning, widgets, navigation menus, plus an
  admin UI in the web app for managing them.
- **Phase 10 — Blog**: blog posts/categories, polymorphic comments (shared with CMS
  pages).
- **Phase 11 — Media**: object-storage-backed media assets, polymorphic attachments,
  albums; wires up the MinIO/S3 client already provisioned in `docker-compose.yml`.
- **Phase 12 — Moderation & Trust**: reports, infractions, bans, moderation audit log,
  polymorphic reactions.
- **Phase 13 — Notifications**: in-app notification feed, preferences, BullMQ-driven
  fan-out (queue infra already provisioned via Redis in `docker-compose.yml`).
- **Phase 14 — Search**: start with Postgres `tsvector` + GIN indexes on
  threads/posts/pages; document an upgrade path to Meilisearch/OpenSearch if/when
  relevance or scale requires it.
- **Phase 15 — Payments/subscriptions**: paid usergroup-style subscriptions with a
  pluggable payment gateway abstraction.

Each phase should ship with its own unit + integration tests and pass the existing
`ci.yml` pipeline before merging — no phase should regress the "always green" baseline
established in Phase 5.
