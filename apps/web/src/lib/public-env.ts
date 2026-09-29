import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_CONVEX_URL: z.string().url().refine((value) => {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) && !url.hostname.endsWith(".convex.site");
    } catch {
      return false;
    }
  }, "Use the deployment URL, not the HTTP actions URL"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().regex(/^pk_(test|live)_[A-Za-z0-9+/=]+$/),
});

// Explicit accesses allow Next.js to inline public variables.
export const publicEnv = schema.safeParse({
  NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
});

export const setupMessage =
  "Configure apps/web/.env.local with NEXT_PUBLIC_CONVEX_URL, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, and CLERK_SECRET_KEY. Run npx convex dev from apps/web to connect your Convex deployment, then restart npm run dev. See README.md for service setup.";
