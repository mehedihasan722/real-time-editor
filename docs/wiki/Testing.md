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

The studio fixture checks changing canvas pixels during Blender clip playback, stable pixels under reduced motion, model switching, and cleanup. When a headless browser cannot create WebGL2 (as observed in Linux CI Firefox), it asserts the rendered-poster fallback instead; GLB animation channels are checked independently. This keeps software-rendered playback checks separate from unavailable-GPU behavior.

The spatial-design suite tests real unconfigured sign-in/sign-up pages across mobile, tablet, and desktop widths, mobile form ordering, scene controls, navigation, and protected-route/API refusal. A mock Clerk form checks keyboard input access; shared dashboard fixtures cover all five destination banners while retaining page content. The complete local Chromium/WebKit/mobile run passed 107 checks with one Windows WebKit GLB skip. Live Clerk authentication and actual-device performance remain launch requirements.

## Carousel and review design

The home carousel layout fixtures use rendered Blender posters, keeping keyboard and responsive checks independent of GPU availability. The dedicated GLB fixture checks real studio and carousel-sculpture playback, reduced-motion pixels, model switching, and GPU removal. It allows 60 seconds for shader compilation, screenshots, and multiple GPU cleanups on software renderers.

Review-section fixtures verify explicit sample-content labels, previous/next wrapping, keyboard selection, template navigation, mobile sizing, stable section height, and reduced-motion transitions. No customer endorsements, aggregate scores, or verified-review claims are established by these tests.


## Editorial landing and workflow validation

`editorial-design.spec.ts` tests the real `/welcome` route at 320, 768, and 1440 pixels in both themes: no horizontal overflow, appearance controls, anchors, footer destinations, sampled 4.5:1 text contrast, reduced-motion skip-link focus, and protected-page/API refusal. The GLB fixture also verifies the workflow factory changes pixels during playback, stays still under reduced motion, and falls back to its PNG after GPU context loss.

Playwright starts `scripts/start-standalone.cjs` directly so npm workspace forwarding cannot consume the port and hostname flags. Build first; use one worker on memory-constrained Windows hosts. Fixture tests do not establish live Clerk, Convex, Liveblocks, AI, or email behavior.


Validation on 7 October 2026: optimized build and TypeScript, ESLint, 138 unit regressions, and a production dependency audit passed. The complete local Chromium/WebKit/mobile matrix passed 158 checks with one expected Windows WebKit WebGL skip. Of these, 143 passing checks belong to this revision; 15 cover pre-existing review-section edits that remain outside the commit. Firefox is delegated to Linux CI. Live authenticated services and physical-device performance are not certified by fixture tests.
