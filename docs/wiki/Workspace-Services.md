# Workspace services and Blender visuals

These integrations are implemented but need accounts and environment configuration before live use. No account was created and no external email was sent during development. Clerk remains the identity provider; Convex and Liveblocks remain the primary board database and collaboration services.

| Service | Application behavior | Configuration |
| --- | --- | --- |
| Supabase | Save/download/delete the latest private editable JSON snapshot from Board cloud services | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BACKUP_BUCKET |
| Resend | Email the current board link to the signed-in user's verified primary Clerk address | RESEND_API_KEY, RESEND_FROM_EMAIL, APP_URL |
| Clerk | Existing sign-in, organizations, roles, and verified email identity | Existing Clerk public/secret keys and Convex issuer |
| Cloudflare | Optional Turnstile challenge for cloud actions and semantic search; server checks action and hostname | NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY, APP_URL |
| PostHog | Optional product events after explicit browser consent; anonymous session ID, no board text/IDs/email/URLs, no replay or autocapture | NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST |
| Sentry | Existing sanitized client/server error monitoring | NEXT_PUBLIC_SENTRY_DSN, SENTRY_DSN |
| Upstash | Atomic Redis rate limit of 12 cloud requests per user/team per 60-second window; fails closed when unavailable | UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN |
| Pinecone | Explicit board-title indexing and semantic search within the active organization namespace | PINECONE_API_KEY, PINECONE_INDEX_HOST |

Use Settings → Integrations to inspect configured services and opt in to analytics. Configuration status does not prove live connectivity. Board files has a Cloud services dialog. Snapshot download produces an editable JSON file; Import editable board adds its content through the existing import flow. Indexing sends only the current board title, never layer contents. Search results are checked against current Convex access, so foreign/deleted records are not returned.

## Account setup

1. Create a Supabase project. Create a **private** Storage bucket named `flowboard-backups`, restrict it to `application/json` and a 3,000,000-byte maximum. Put the project URL and service-role key in server environment variables. The server checks bucket privacy before each action. Do not grant anonymous bucket access or expose the service-role key in a public variable. Service-role storage access bypasses RLS; the application authorizes the current Clerk organization and board first.
2. Create a Resend account and verify a sender domain. Set the API key and verified From address. Set APP_URL to the intended HTTPS application origin. No recipient field is accepted from the client: delivery goes only to the signed-in user's verified primary email. Identical requests in a ten-minute window share an idempotency key. Existing Clerk invitations continue using Clerk delivery.
3. Keep the existing Clerk organization and Convex integration settings. New storage/search features use the same Clerk session and board permission checks. This change does not introduce Supabase Auth or replace Clerk.
4. Create a Cloudflare Turnstile widget, allow the deployed application hostname, and set its site/secret keys. Tokens are checked server-side for the `workspace-services` action and APP_URL hostname. Partial configuration blocks cloud operations. Cloudflare DNS/CDN proxying requires a domain and is an account-level setup step; it was not activated here. Do not cache authenticated HTML, APIs, Clerk proxy routes, or board responses if you later proxy the site through Cloudflare. Public model files may be cached normally.
5. Create a PostHog project. Set the public project key and either `https://us.i.posthog.com` or `https://eu.i.posthog.com`. Analytics starts only after consent in Settings and respects Do Not Track. Disable it by clearing the key or withdrawing consent. IP geolocation/person profiles are disabled in event properties; review the vendor's project retention and privacy settings for your deployment.
6. Create a Sentry Next.js project and configure the DSNs. The existing monitoring module strips request/user/breadcrumb/extra payloads and sanitizes exception messages. Validate delivery using a controlled test environment.
7. Create an Upstash Redis database and store its REST URL/token server-side. Cloud actions require it even if Turnstile is disabled. The existing AI quota in Convex remains in place.
8. Create a Pinecone dense index with integrated embeddings and map the text field to `chunk_text`. Set its index host and API key server-side. Use a region consistent with your data residency needs. Index a board title explicitly from the cloud dialog; search from Settings. Rename requires reindexing. Deleted titles can remain in Pinecone until an operator purges them, but search reauthorizes current records before returning anything.

All server secrets are listed in `.env.example` and excluded from version control. Set them in `apps/web/.env.local` for development and in the hosting environment for production. Rebuild when changing NEXT_PUBLIC values. Docker production build arguments include only public PostHog, Turnstile, Sentry, Clerk, and Convex values; secrets are runtime configuration.

## Retention and recovery

Supabase keeps one latest snapshot per team/board, overwritten only after confirmation. Snapshots exclude comments, identities and history. They persist after board deletion. Delete a cloud snapshot from the dialog **before** deleting its board, or purge the corresponding `<orgId>/<boardId>.json` object through the Supabase dashboard afterward. There is no scheduled backup or automatic cleanup across providers. Configure retention and deletion procedures before launch; the manual snapshot feature is not a complete disaster-recovery system.

## Original Blender assets

The home carousel and template gallery use original sticky-note, task-board, and roadmap models. Editable sources are in `assets/blender/*.blend`; website GLB files and transparent PNG posters are in `apps/web/public/models`. Rebuild with installed Blender:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' --background --python scripts/create-workspace-models.py
```

Three.js loads the GLB models lazily, caps pixel ratio, stops rendering off-screen or when the tab is hidden, respects system/app reduced-motion settings, cancels pending loads, and disposes geometry/material/renderer resources on unmount. Posters remain the fallback when WebGL or model loading is unavailable. There are no third-party textures or licensed model assets.

The home carousel includes an original isometric planning studio inspired by the owner's Sendoso video reference: a large dashboard, a task-card workflow lane, a Kanban tower, laptop stations, and four teammates. Blender-authored clips animate cards, progress bars, and gestures in an approximately eight-second loop. The reference clip is not shipped as a website asset. Rebuild `assets/blender/workspace.blend`, `workspace.glb`, and its poster with:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.1/blender.exe' --background --python scripts/create-workspace-studio.py
```

The browser plays exported clips through Three.js AnimationMixer and freezes a representative frame when reduced motion is enabled. Off-screen/hidden scenes pause without advancing their timeline, and mixers are released on removal.

The first home slide and authentication pages use the newer electric-blue cloud scene. See [Spatial design](Spatial-Design) for shared page banners, animation controls, and rebuilding `cloud.blend`.

The studio GLB is about 2.1 MB and contains 32 clips with 52 animation channels. The production build, TypeScript, and lint pass; focused browser checks verify the scene, fallback assets, and hero layouts from 320 to 1440 pixels. Real-device performance remains part of the launch checks in issue #7.

## Development verification

TypeScript, ESLint, the optimized production build, and 138 regression tests passed. Across the full and focused local browser runs, 86 distinct checks passed on Chromium, WebKit, and mobile; Windows WebKit skipped the GLB WebGL fixture. Both Compose configurations validated and the runtime dependency audit reported zero known vulnerabilities. These results cover local fixtures and mocked vendor boundaries; live service activation is tracked in [issue #7](https://github.com/mehedihasan722/real-time-editor/issues/7).

## API references

- [Supabase private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals) and [service-role access](https://supabase.com/docs/guides/storage/security/access-control)
- [Resend email API](https://resend.com/docs/api-reference/emails/send-email)
- [Cloudflare client rendering](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/) and [server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Upstash REST API](https://upstash.com/docs/redis/features/restapi)
- [Pinecone text upsert](https://docs.pinecone.io/reference/api/2025-10/data-plane/upsert_records) and [text search](https://docs.pinecone.io/reference/api/2025-10/data-plane/search_records)
- [PostHog JavaScript configuration](https://posthog.com/docs/libraries/js)
