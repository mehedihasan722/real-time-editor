# Real-time collaborative board

A Miro-inspired whiteboard built with Next.js, Clerk, Convex, and Liveblocks. Teams can create boards, add notes, text, shapes, and freehand paths, and collaborate live.

## Local setup

Install dependencies and configure `.env.local` using `.env.example`. Create a Clerk application, a Convex deployment, and a Liveblocks project, then run Convex and Next.js in separate terminals:

```bash
npm install
npx convex dev
npm run dev
```

Open http://localhost:3000. The workspace dashboard lives in `src/app/(dashboard)` and the board editor in `src/app/board/[boardId]`. Board metadata is stored in Convex; canvas content and presence use Liveblocks.
