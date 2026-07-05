# Database Design

This is the full entity design across all 9 domains of the platform. It is an **original,
normalized PostgreSQL schema** — informed by studying the general shape of forum/CMS
software (many threads/posts/PMs/social-groups/CMS-pages systems share these concepts),
but structurally distinct from any specific product:

- No bitmask permission integers — access control is modeled with explicit
  `roles` / `permissions` / join-table rows.
- No Unix-epoch-int timestamp columns — every timestamp is `TIMESTAMPTZ`.
- No denormalized "cached last poster name" columns without a backing foreign key.
- Polymorphic relations (attachments, comments, reactions) use an
  `entity_type` + `entity_id` pair rather than one join table per content type.
- UUID primary keys throughout.

**Implementation status**: Domains 1–3 (Identity & Access, Forum Core, Social) are
implemented now as Prisma models in
[`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma), with real
migrations and tests. Domains 4–9 are specified here so the full shape of the system is
designed up front, and are built out incrementally — see [`ROADMAP.md`](./ROADMAP.md)
for the phase-by-phase plan. Each new domain follows the exact module pattern
established by Forum Core (`module/`, `*.service.ts`, `*.controller.ts`, `dto/`,
`*.spec.ts`).

---

## 1. Identity & Access — *implemented*

| Table | Purpose |
|---|---|
| `users` | Account record: username, email, password hash, display name, status, timestamps |
| `roles` | Named roles (`admin`, `moderator`, `member`, ...) |
| `permissions` | Fine-grained permission keys (e.g. `board.create`, `user.ban`) |
| `role_permissions` | Role ↔ permission assignment |
| `user_roles` | User ↔ role assignment (a user may hold multiple roles) |
| `refresh_tokens` | Hashed refresh tokens with expiry/revocation, one row per issued session |
| `password_reset_tokens` | One-time tokens for password reset flows |
| `email_verification_tokens` | One-time tokens for email verification |

## 2. Forum Core — *implemented*

| Table | Purpose |
|---|---|
| `boards` | Discussion containers, self-referencing `parent_id` for nesting |
| `board_permissions` | Per-board, per-role view/post/moderate flags |
| `threads` | Topics within a board |
| `posts` | Messages within a thread; `parent_post_id` for reply-to |
| `post_revisions` | Edit history for posts |
| `tags` / `thread_tags` | Free-form tagging of threads |
| `polls` / `poll_options` / `poll_votes` | Optional poll attached 1:1 to a thread |
| `thread_subscriptions` | User subscriptions to threads for notifications |

## 3. Social — *implemented*

| Table | Purpose |
|---|---|
| `conversations` / `conversation_participants` / `messages` | Private messaging (multi-participant capable) |
| `groups` | Social/interest groups (public, moderated, or invite-only) |
| `group_members` | Membership with role (owner/moderator/member) and status (active/pending/invited) |
| `group_discussions` / `group_discussion_replies` | Discussions scoped to a group |
| `profile_comments` | Public "wall" comments on a user's profile |
| `follows` | User-to-user follow/friend relationships |

## 4. CMS — *roadmap*

| Table | Purpose |
|---|---|
| `pages` | CMS content pages (draft/published/archived) |
| `page_versions` | Version history for page bodies |
| `widgets` | Configurable layout blocks (JSON config) placed on pages |
| `menus` / `menu_items` | Site navigation, admin-configurable |

## 5. Blog — *roadmap*

| Table | Purpose |
|---|---|
| `blog_posts` | Long-form posts, distinct from forum threads |
| `blog_categories` / `blog_post_categories` | Categorization |
| `comments` | Polymorphic (`entity_type`/`entity_id`) — reused for blog posts and CMS pages |

## 6. Media — *roadmap*

| Table | Purpose |
|---|---|
| `media_assets` | Uploaded file metadata: storage key, mime type, size, checksum |
| `attachments` | Polymorphic link from any entity to a `media_asset` |
| `albums` / `album_items` | User photo albums |

## 7. Moderation & Trust — *roadmap*

| Table | Purpose |
|---|---|
| `reports` | User reports against any entity (polymorphic), with a review workflow |
| `infractions` | Points issued to a user for rule violations, with expiry |
| `bans` | Temporary or permanent bans |
| `moderation_actions` | Audit log of moderator actions |
| `reactions` | Polymorphic like/love/etc. reactions (replaces a flat reputation integer) |

## 8. Notifications — *roadmap*

| Table | Purpose |
|---|---|
| `notifications` | In-app notification feed per user (JSON payload, read/unread) |
| `notification_preferences` | Per-user, per-channel, per-type opt-in/out |

## 9. Admin — *roadmap*

| Table | Purpose |
|---|---|
| `site_settings` | Key/value (JSONB) site configuration |
| `audit_logs` | Generic admin action audit trail |

---

## Conventions

- **IDs**: `UUID`, generated application-side via `@default(uuid())`.
- **Timestamps**: `created_at` / `updated_at` as `TIMESTAMPTZ`, defaulting to `now()`.
- **Soft delete**: entities that need it use an `is_deleted` boolean rather than
  physically deleting rows (forum threads/posts, for moderation/audit purposes).
- **Naming**: `snake_case` columns in Postgres (via Prisma `@map`), `camelCase` in
  TypeScript models — handled automatically by Prisma's mapping layer.
