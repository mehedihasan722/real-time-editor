# Testing and release verification

## Local quality checks

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Regression tests cover AI authorization and payload boundaries, malformed AI output, board pagination, deletion scheduling, cleanup retries, editable board validation, drawing recognition, games, environment handling, comments, and CSV safety.

The default browser suite runs against the production build with services deliberately unset. It verifies the setup screen, readiness failure, protected APIs, real PNG/PDF rendering in both themes, and starter actions. Theme fixtures check representative dashboard, settings, admin, games, comments, Clerk and Assist text at a 4.5:1 contrast target. It does not establish live Clerk/Convex/Liveblocks connectivity.

## Live collaboration tests

Use dedicated test users and a test organization. Store Playwright authentication state under `apps/web/.auth` (ignored by Git). For example, use Playwright codegen with `--save-storage` while signing in to the configured app, then close it. The state file contains session credentials; never commit it or upload it publicly.

Set `FLOWBOARD_E2E_AUTH_STATE` to the absolute state-file path. Optionally set `FLOWBOARD_E2E_URL` for an existing test deployment and `FLOWBOARD_E2E_OTHER_ORG_STATE` for a second user in a different organization.

```sh
npm run test:e2e:live
```

The live suite creates a disposable board, edits a note, verifies it in a second browser context, downloads editable JSON/PNG/PDF, and deletes the test board. With the second organization state, it also verifies that a stranger cannot authorize the room. It requires real connected services and valid test sessions; missing authentication state fails with setup instructions.

## Board files and bounds

- Boards support 5,000 objects with viewport culling and explain when that limit is reached.
- Template and editable-file insertion is all-or-nothing when capacity is insufficient.
- Editable files use versioned JSON, validate every layer, and must be at most 10 MB. Imports add objects rather than replacing existing content.
- PNG/PDF exports include board objects, not comments or cursor presence. Images scale to fit a maximum 4,096-pixel export dimension.
- PNG/JPEG/WebP uploads up to 10 MB are resized and compressed locally. Stored image payloads are limited to 256 KB; detailed images may require manual resizing.
- JSON imports reject active SVG image data, unsupported layer types, nonfinite/out-of-range coordinates, and unsafe note links.

Verify mobile editing and exports on your supported browsers before announcing support for a new device family. Keep live test accounts separate from production workspaces.

The fixture matrix includes Chromium, Firefox, WebKit and mobile Chromium. Install them with `npx playwright install chromium firefox webkit`. `npm run test:e2e -- --project=chromium` selects a project. The manual authenticated workflow and dedicated primary/peer/admin/member/guest sessions are described in [Enterprise architecture](Enterprise-Architecture).

## Cloud services and Blender previews

The regression suite covers Supabase private-bucket enforcement and organization object paths, atomic Upstash quotas, Cloudflare token hostname/action checks, Pinecone organization namespaces and current-board reauthorization, verified-self email delivery, and PostHog consent/privacy boundaries. Upstream services are mocked: account provisioning, paid requests, email delivery, and live vendor behavior are not verified without credentials.

Browser fixtures exercise the cloud dialog's explicit email/index/backup actions and backup confirmation. GLB checks load real Blender-generated assets, switch models, and verify canvas removal; static model/poster requests also run without service credentials. Windows WebKit skips the WebGL fixture but retains poster and carousel checks; Linux CI attempts the fixture normally.

Firefox skips only the service-worker offline emulation check because Playwright's worker network controls are [supported on Chromium](https://playwright.dev/docs/service-workers) and the CI Firefox worker continued reaching the live origin under offline emulation. The recovery HTML and retry controls are checked on all browser projects. This does not assert real Firefox offline behavior; verify it on an actual offline device before release.

Responsive carousel tests establish reduced-motion media before navigation so Windows WebKit does not retain stale computed animation styles after late media emulation. Preference changes and model removal retain their separate runtime checks.
