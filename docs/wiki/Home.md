# Flowboard development setup

See [Spatial design](Spatial-Design) for the animated website and branded authentication experience.

Flowboard is a Turborepo. The Next.js application and its local environment file live in `apps/web`.

See [Enterprise architecture](Enterprise-Architecture) for shared packages, role enforcement, export workers, monitoring and release prerequisites.

See [Canvas 2D engine](Canvas-2D-Engine) for vector persistence, versioned commits, rendering controls and limits.

## Required services

Configure these values in `apps/web/.env.local`:

```env
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
LIVEBLOCKS_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

The Clerk publishable and secret keys must come from the same Clerk application. Activate Clerk's Convex integration for the development instance so its normal session token includes the `aud: "convex"` claim.

From `apps/web`, store Clerk's Frontend API URL on the Convex deployment and push the functions:

```powershell
npx convex env set CLERK_FRONTEND_API_URL https://your-instance.clerk.accounts.dev
npx convex dev --once
```

`apps/web/convex/auth.config.js` reads this environment variable, which keeps the issuer configuration consistent across deployments.

## Start and verify

From the repository root:

```powershell
npm run dev
npm run typecheck
npm run lint
npm run build
node --test apps/web/tests/public-env.test.cjs
```

The repository also runs these checks in `.github/workflows/quality.yml` for every pull request and push. The `/api/health` readiness endpoint returns HTTP 200 only when Clerk, Convex, and Liveblocks configuration is present, and returns HTTP 503 without exposing credentials when setup is incomplete.

Production images use the Dockerfile's final non-root standalone server. Docker Compose selects the development target for hot reload. Only the two `NEXT_PUBLIC_*` values belong in Docker build arguments; provide Clerk and Liveblocks secrets when the container starts.

Open `http://localhost:3030/sign-in` for host development, or `http://localhost:3031/sign-in` for development Compose (unless FLOWBOARD_DOCKER_PORT overrides it). Clerk development instances may first redirect through their account-domain handshake and then return to the local sign-in page.

## Board workspace controls

- Flowboard Assist opens on a blank board. AI board generation and Hermes chat use configured server endpoints. AI notes are previewed before insertion. Starter templates remain available without an AI provider.
- Use the left toolbar to select, write, add sticky notes, create rectangles or ellipses, draw, and undo or redo changes. Sticky notes use a FigJam-inspired layout with roomy editable text, creator attribution, resize handles, and a dark selection toolbar.
- Choose the plus button at the bottom of the creation toolbar to open Formats & Flows. Prototype, Diagram, Table, Timeline, Kanban, Doc, Slides, Activities, Talktrack, and Flows each insert editable Liveblocks layers at the center of the current view.
- Diagram & Shapes opens a searchable library of editable SVG shapes. Manage shapes enables or hides Basic, Flowchart, Connector, Callout, UML, ERD, and AWS collections; the selection is validated with Zod and saved in the browser.
- The expanded diagram catalog includes AWS, UML, VMware, Azure, BPMN, Salesforce, Value Stream Mapping, Data Flow, Google Cloud, Cisco, ERD, and Kubernetes collections. Each section starts with a compact preview; selecting `+N shapes` reveals exactly N insertable shapes for that pack.
- The drawing palette provides pen, translucent marker, pressure-styled drawing, and a path eraser. Choose a 4, 8, or 16 pixel width; the selected tool and width are stored with each collaborative path.
- The drawing color button opens a live width slider, preset swatches, and a custom color picker. FigJam-inspired notes persist typeface, text size, bold, strike, list, and link formatting for all collaborators.
- Shapes & Lines inserts connectors and geometric shapes; Frames inserts document, aspect-ratio, and device canvases; Stickers inserts searchable, movable, and resizable offline emoji artwork.
- The plus button opens a searchable Tools and Marketplace catalog whose supported rows route to real templates, creation modes, and specialized sidebars.
- Settings provides Light, Dark, and System appearance modes plus persistent canvas grid, high-contrast, and reduced-motion preferences. Theme and canvas settings apply to dashboards, dialogs, board chrome, skeletons, and diagram libraries.
- The star in the board header toggles the current user's favourite state through Convex. The result updates reactively and appears under Favourite boards for the selected organization.
- The dashboard list is a responsive data table with sortable Name, Created, and Owner columns, owner/date filters, a favourites-only switch, and a favourite button on each row. Grid view remains available.
- Sticky notes include Arial, Calibri, Times New Roman, Georgia, Verdana, Courier New, and Comic Sans font choices. Sticker emoji scale with the resized layer bounds.
- Hold and drag the middle mouse button to pan the board. The Object eraser removes a complete freehand stroke; the Partial eraser removes only the crossed portion. Smart drawing smooths curves and snaps near-straight strokes.
- Flowboard Assist recognizes roadmap, flowchart, research, kanban, timeline, table, prototype, slides, document, retrospective, update, and diagram commands. A request such as `Create 5 sticky notes for launch ideas` creates the requested number of collaborative notes.
- Scroll or use a trackpad to pan. Hold Ctrl/Cmd while scrolling, use `+` and `-`, or use the lower-right controls to zoom from 25% to 200%. The focus control resets the view to 100%.
- Share copies the current board URL. Teammates must belong to the board's Clerk organization before Liveblocks grants room access.
- Convex verifies the active Clerk organization for every board read and mutation, preventing a client from reading or changing another organization's board by supplying its ID.
- The loading screen mirrors the final board chrome with accessible shimmer placeholders and respects reduced-motion preferences.

## Troubleshooting

- `No address provided to ConvexReactClient`: run `npx convex dev` from `apps/web` and restart Next.js.
- Setup screen with HTTP 503: one or more required service variables are empty or invalid.
- Protected pages return 404 or cannot sign in: confirm the Clerk keys belong to the same application and that `/sign-in` and `/sign-up` are configured as public routes.
- Convex queries remain unauthenticated after Clerk sign-in: confirm the Clerk Convex integration is enabled, verify `CLERK_FRONTEND_API_URL` with `npx convex env get CLERK_FRONTEND_API_URL`, then deploy with `npx convex dev --once`.
- `Cannot find module './<chunk>.js'` from `.next`: stop the development server, remove only `apps/web/.next`, and restart. Do not run `next build` concurrently with `next dev` because both use the generated `.next` directory.


## Production operations

- [Workspace services and Blender visuals](Workspace-Services)

- [Production readiness review](Production-Readiness)

- [Production and Vercel automation](Production)
- [Hermes Agent and AI generation](AI-Assistant)
- [Testing and release verification](Testing)
- [Recent changes](Recent-Changes)
