# Flowboard

Flowboard is a collaborative visual workspace built with Next.js, Convex, Clerk, and Liveblocks. It uses Turborepo with the web application in apps/web. The same responsive site can be installed as a PWA on supported mobile and desktop browsers.

## Features

- Create blank boards or starter boards with editable notes and headings.
- Draw, add text and shapes, move and resize layers, and collaborate with live cursors.
- Search, sort, star, and manage team boards.
- Use the admin dashboard for board counts, creation trends, owner distribution, invitations, and board controls.
- Open the in-app guide at /guide and browse templates at /templates.
- Install the app from a supported browser. The offline fallback explains when board sync is unavailable.

## Service setup

1. Create a Clerk application with Organizations enabled. Configure its Convex JWT template and use the same Clerk issuer as apps/web/convex/auth.config.js.
2. Create a Convex project and run the Convex CLI from apps/web to deploy the schema and functions.
3. Create a Liveblocks project and copy its secret key.
4. Copy .env.example to .env.local at the repository root for Docker, and to apps/web/.env.local for local Next.js development. Fill in every value. Keep both files private.
5. In one terminal, run cd apps/web followed by npx convex dev. In another terminal at the repository root, run npm install followed by npm run dev.
6. Open http://localhost:3000 and sign in. Create or select a Clerk organization to make boards.

The Convex deployment, Clerk application, and Liveblocks project are external services. Without their credentials the site cannot load boards. A connected deployment is required to verify live collaboration and admin data end to end.

## Project commands

Run these from the repository root:

- npm run dev — start the web app through Turborepo.
- npm run typecheck — check TypeScript.
- npm run lint — run Next.js ESLint.
- npm run build — build all workspaces.

## Docker development

Copy .env.example to .env.local at the repository root. Run npx convex dev from apps/web on the host to connect the Convex deployment, then run docker compose up --build at the repository root. Open http://localhost:3000.

Docker Compose mounts source files for hot reload. Start Docker Desktop before building the image. Environment values come from .env.local and are excluded from the Docker build context.

## Using Flowboard

The dashboard shows templates and your team's boards. Create a board, then use the left board toolbar to add sticky notes, text, rectangles, ellipses, or freehand paths. Select an item to move, resize, recolor, or delete it. Delete or Backspace removes selected items; Ctrl/Cmd+Z and Ctrl/Cmd+Y manage history. Scroll to pan. Invite teammates to collaborate in the same organization.

Organization admins can open /admin to inspect board records and manage boards. Its charts show board creation and ownership, not session-level usage. The /guide page explains the workflow inside the app.

## Installation

On supported Chrome or Edge desktop browsers, use the browser Install app control. On Android, use Install app or Add to Home screen. On iOS, use Safari's Share menu and Add to Home Screen. The app shell is installable, but boards require a connection to Convex and Liveblocks.
