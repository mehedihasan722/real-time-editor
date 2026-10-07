# Flowboard

Flowboard is a collaborative visual workspace built with Next.js, Convex, Clerk, and Liveblocks. It uses Turborepo with the web application in apps/web. The same responsive site can be installed as a PWA on supported mobile and desktop browsers.

Production operations and integration setup are maintained in [the Wiki source](docs/wiki/Home.md): [Vercel and GitHub automation](docs/wiki/Production.md), [Hermes and AI generation](docs/wiki/AI-Assistant.md), and [release testing](docs/wiki/Testing.md). See [CHANGELOG.md](CHANGELOG.md) for recent changes.

See the [production readiness review](docs/Production-readiness-2026-10-04.md) for verified checks, current dependency findings, and remaining launch conditions.

Optional [workspace services and Blender visuals](docs/wiki/Workspace-Services.md) add private Supabase snapshots, Resend board-link emails, Cloudflare Turnstile, consent-based PostHog events, Upstash rate limits, and Pinecone title search alongside Clerk and Sentry. These features require your service accounts and environment variables. The 3D website models are original Blender assets and work without service credentials.

The [spatial design guide](docs/wiki/Spatial-Design.md) covers the animated cloud artwork, branded sign-in/sign-up pages, dashboard scene banners, pause controls, and Blender rebuild commands. Authentication artwork is available before account setup; protected pages and APIs remain blocked until configuration is complete.

## Features

- Create blank boards or starter boards with editable notes and headings.
- Draw, add text and shapes, move and resize layers, and collaborate with live cursors.
- Search, sort, star, and manage team boards.
- Use the admin dashboard for board counts, creation trends, owner distribution, invitations, and board controls.
- Open the in-app guide at /guide and browse templates at /templates.
- Install the app from a supported browser. The offline fallback explains when board sync is unavailable.
- Play 22 original mini-games at /games: 16 WebGL arcade games and six puzzle/strategy games with raised boards. Includes a first-person target arena, football penalties, racing, an endless runner, egg matching, and flying.
- Discuss boards with persistent Liveblocks comment threads, pinned feedback, mentions, reactions, and resolve/reopen controls.
- Use the magic pen to turn rough geometric strokes into editable shapes while retaining stroke color and width.
- Load additional pages of team/starred boards and admin reports.
- Import/export editable board JSON, export PNG/PDF, and upload compressed PNG/JPEG/WebP images from Board files.
- Preview AI-generated notes before insertion and chat with a configured Hermes Agent server; starter templates work without AI credentials.

## Arcade and performance

The arcade is single-player. Scores are stored locally on the device; it does not provide multiplayer matches or a shared leaderboard. The WebGL renderer uses the installed Three.js dependency, is dynamically loaded when a game opens, caps pixel ratio, disables mobile shadows, stops rendering while paused or hidden, and disposes GPU resources on exit. Hardware acceleration is required for the action games. Game scenes use procedural models rather than licensed game assets.

Library navigation, admin, notifications, and comments follow the app theme. The game worlds retain their own scene lighting. Layouts include narrow-phone breakpoints, keyboard/touch controls, and reduced-motion support.

## Service setup

1. Create a Clerk application with Organizations enabled. Configure its Convex JWT template and use the same Clerk issuer as apps/web/convex/auth.config.js.
2. Create a Convex project and run the Convex CLI from apps/web to deploy the schema and functions.
3. Create a Liveblocks project and copy its secret key.
4. Copy .env.example to apps/web/.env.local for local Next.js development and Docker. Fill in every value. Keep this file private.
5. In one terminal, run cd apps/web followed by npx convex dev. In another terminal at the repository root, run npm install followed by npm run dev.
6. Open http://localhost:3030 and sign in. Create or select a Clerk organization to make boards. The development server uses port 3030 to avoid Windows/Docker reservations around port 3000.

The Convex deployment, Clerk application, and Liveblocks project are external services. Without their credentials the site cannot load boards. A connected deployment is required to verify live collaboration and admin data end to end.

## Project commands

Run these from the repository root:

- npm run dev — start the web app through Turborepo.
- npm run typecheck — check TypeScript.
- npm run lint — run Next.js ESLint.
- npm run build — build all workspaces.
- npm test — run environment and assistant regression tests.
- npm run test:e2e — run production browser smoke tests after a build and Playwright Chromium installation.
- npm run test:e2e:live — run connected collaboration tests with dedicated saved test sessions (see the testing guide).

The `/api/health` endpoint reports HTTP 200 only when public and server service configuration is ready. It returns HTTP 503 without exposing credential values when configuration is incomplete.

## Docker development

Copy .env.example to apps/web/.env.local. Run npx convex dev from apps/web on the host to connect the Convex deployment, then run docker compose up --build at the repository root. Open http://localhost:3031 (or the port set by `FLOWBOARD_DOCKER_PORT`).

Docker Compose mounts source files for hot reload. Start Docker Desktop before building the image. Environment values come from apps/web/.env.local and are excluded from the Docker build context.

For the production container, run `docker compose --env-file apps/web/.env.local -f compose.production.yaml up --build -d`. This uses the standalone server without development mounts and includes a readiness health check. Public variables are supplied at build time; server secrets are supplied at runtime.

The default Docker image target is a non-root, standalone production server. Pass only `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` as build arguments because Next.js embeds public values at build time. Provide `CLERK_SECRET_KEY` and `LIVEBLOCKS_SECRET_KEY` only when starting the container; never pass server secrets as Docker build arguments.

GitHub Actions runs TypeScript, lint, regression tests, an optimized build, and browser smoke tests for every pull request and push. Optional workflows add verified Vercel deployment, failure tracking issues, Projects sync, and Wiki publishing once their documented credentials are configured. PR titles use gitmoji.

## Using Flowboard

The dashboard shows templates and your team's boards. Create a board, then use the left board toolbar to add sticky notes, text, rectangles, ellipses, or freehand paths. Select an item to move, resize, recolor, or delete it. Delete or Backspace removes selected items; Ctrl/Cmd+Z and Ctrl/Cmd+Y manage history. Scroll to pan. Invite teammates to collaborate in the same organization.

Organization admins can open /admin to inspect board records and manage boards. Its charts show board creation and ownership, not session-level usage. The /guide page explains the workflow inside the app.

## Installation

On supported Chrome or Edge desktop browsers, use the browser Install app control. On Android, use Install app or Add to Home screen. On iOS, use Safari's Share menu and Add to Home Screen. The app shell is installable, but boards require a connection to Convex and Liveblocks.

## Fix: No address provided to ConvexReactClient

Next.js runs in apps/web, so a root .env.local alone does not configure local development. Missing or invalid public configuration now shows a setup screen; protected routes and APIs return HTTP 503 until configured.

From the repository root in PowerShell, create the local file only if it does not already exist:

~~~powershell
if (!(Test-Path apps/web/.env.local)) { Copy-Item .env.example apps/web/.env.local }
cd apps/web
npx convex dev
~~~

Select your existing Convex project. The CLI writes CONVEX_DEPLOYMENT and NEXT_PUBLIC_CONVEX_URL to apps/web/.env.local. Use the deployment URL (normally ending in .convex.cloud), not the .convex.site HTTP actions URL. Add your Clerk publishable/secret keys and Liveblocks secret to the same file. Keep secrets local; never commit them.

After activating Clerk's Convex integration, configure the development deployment with `npx convex env set CLERK_FRONTEND_API_URL https://your-instance.clerk.accounts.dev` from `apps/web`. The deployed auth configuration reads the issuer from this Convex environment variable.

The current Clerk integration adds `aud: "convex"` to the normal session token. The Liveblocks authorization endpoint uses that session token and retains compatibility with older Clerk applications that still provide a `convex` JWT template.

The Clerk redirect variables from `.env.example` configure the built-in `/sign-in` and `/sign-up` routes. Copy them unchanged into `apps/web/.env.local` when adding credentials.

Restart npm run dev from the repository root after changing configuration. For Docker, update apps/web/.env.local and recreate the service with docker compose up --build --force-recreate. For hosted deployments, set these variables in the hosting environment before rebuilding; Next.js public variables are embedded at build time.

Reference: [Convex Next.js setup](https://docs.convex.dev/quickstart/nextjs).

Regression checks: run npm run typecheck, npm run lint, npm run build, and node --test apps/web/tests/public-env.test.cjs. With service variables unset, the dashboard and admin routes return the setup page and /api/liveblocks-auth returns JSON with HTTP 503. Live service connectivity still requires real credentials.

Local AI setup: start Docker Desktop and run `npm run ai:setup`. This provisions an isolated Hermes Agent and Ollama model, tests a real response, then configures unset local AI variables. Restart the development server afterward. Vercel requires a separate authenticated HTTPS AI host; your laptop endpoint is local only. See [AI setup](docs/wiki/AI-Assistant.md).
