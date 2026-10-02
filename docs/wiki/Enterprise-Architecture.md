# Enterprise architecture and verification

Flowboard uses Next.js App Router and Turborepo. Shared source packages are `@flowboard/ui` (Radix components), `@flowboard/types` (canvas contracts), `@flowboard/utils` (geometry, spatial indexing and serialization), `@flowboard/hooks` (frame scheduling and performance observation), and `@flowboard/config` (strict TypeScript and Tailwind configuration). Next transpiles the packages; the Docker dependency stage includes their manifests. Build checks depend on shared-package type checks. Application aliases remain compatible with existing imports.

Native development remains at `http://localhost:3030`. Development Compose maps `http://localhost:3031` to port 3030 inside the container and binds the host port to loopback. Override `FLOWBOARD_DOCKER_PORT` to choose another host port. Production containers retain their existing production server on port 3000. The shared config directory participates in Turbo cache invalidation.

## Rendering and interaction

Canvas, workspace editors and arcade views load dynamically. Three.js loads only when a game starts. A uniform spatial grid culls offscreen objects, preserves stacking order, and retains selected objects. Boards accept at most 5,000 objects; JSON imports remain bounded at 10 MB and embedded images at 256 KB. A 10,000-object synthetic index test compares culling with a brute-force reference. This is not a measured 60 FPS guarantee: benchmark representative boards and target devices before setting a performance SLA.

Exports temporarily render all objects, including offscreen objects. DOM styling and rasterization require browser DOM access; style capture yields periodically. PNG compression and PDF assembly run in disposable workers. Image compression uses OffscreenCanvas workers where supported. Older WebKit uses worker PNG encoding and an asynchronous native image encoder. Export jobs have a 60-second timeout and terminate on every outcome.

The shared Radix controls manage dialog focus, dismissal and keyboard interaction. Ctrl/Cmd+K opens workspace navigation. Framer Motion handles cursor interpolation and Playground entrance animation; OS reduced-motion preferences and the saved workspace preference disable transform animation.

## Tenant boundaries and roles

Every public Convex board operation checks its verified Clerk identity and active organization against the stored board organization. Client-supplied organization IDs never grant access. Both legacy `org_id`/`org_role` claims and compact Clerk `o.id`/`o.rol` claims are supported. Unknown or missing roles fail closed as Guest. Older Convex JWT templates must include the active organization role; do not assign a static admin role in a template.

| Role | Read boards | Create/edit/delete boards | Board export / Assist | Invite members / admin report |
| --- | --- | --- | --- | --- |
| Owner | Yes | Yes | Yes | Yes |
| Admin | Yes | Yes | Yes | Yes |
| Member | Yes | Yes | Yes | No |
| Guest | Yes | No | No | No |

Liveblocks issues read-only room permissions for guests. Editor controls and contenteditable fields are disabled in the guest canvas. Clerk enforces invitation permissions; the UI also checks the administrative role. `boards.adminList` independently validates the organization and administrative role in Convex. Custom Owner/Guest roles must also be configured in Clerk; the code does not change existing membership assignments.

## Synchronization and AI

Liveblocks batches socket traffic at 50 ms. Cursor events additionally coalesce per animation frame. Each useMutation remains an atomic storage batch. Pending edits remain in the open room during reconnects, with a sync indicator and an unsaved-change navigation warning. The service worker provides an offline navigation fallback and does not cache authenticated board pages or API responses. Pending changes are **not durably preserved after a browser crash or tab closure**; this is not a fully offline editor.

Hermes chat supports bounded SSE streaming, split UTF-8 chunks, cancellation propagated to the upstream request, and a 50-second upstream timeout. Generation remains validated JSON with an editable preview before insertion. Invalid output never enters collaborative storage. Only submitted Assist messages reach the provider. Convex atomically limits Assist to 12 attempts per user/organization/minute; limits persist across serverless instances. Provider failures retain a retryable prompt and existing starter templates remain available.

Local Hermes/Ollama endpoints work on the development computer. Vercel still requires an authenticated HTTPS AI host reachable from its runtime. This repository cannot provision an unlimited hosted provider without an account or infrastructure.

## Monitoring and release gates

Set `NEXT_PUBLIC_SENTRY_DSN` at build time and `SENTRY_DSN` at runtime to enable sanitized Sentry errors and sampled performance spans. Monitoring is disabled without a DSN. Reports exclude request bodies, headers, cookies, user information, AI input/output, and original exception messages. Global and route error boundaries provide recovery controls. The canvas observes long tasks, rooms measure synchronization duration, and games sample render duration and report context loss. GPU geometries, materials, textures, shadow buffers and contexts are disposed on exit or initialization failure.

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:e2e` are release checks. Browser CI covers Chromium, Firefox, WebKit and mobile Chromium, including contrast, offline fallback and worker exports. Public static routes are prerendered; authenticated APIs and board routes remain dynamic. Never share-cache tenant responses.

The manual **Authenticated workspace verification** workflow requires `FLOWBOARD_E2E_URL` (a deployed HTTPS preview/staging URL) and encrypted `FLOWBOARD_E2E_PRIMARY_STATE` / `FLOWBOARD_E2E_PEER_STATE` secrets containing Playwright storage states for two distinct users in the same dedicated test organization. Optional ADMIN, MEMBER, GUEST and OTHER_ORG states enable role/tenant scenarios. It creates and removes synthetic boards, verifies two-way synchronization and reconnect convergence, and exercises admin exports. Authenticated traces and session files are not uploaded.

Without those dedicated sessions, live multi-user and role workflows cannot be certified. A passing fixture suite does not certify provider availability, tenant behavior in a live deployment, or a performance SLA. Configure production service credentials, HTTPS AI hosting and monitoring before accepting production readiness.
