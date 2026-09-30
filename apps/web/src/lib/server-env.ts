import { z } from "zod";

const serverEnvSchema = z.object({
  CLERK_SECRET_KEY: z.string().trim().min(1),
  LIVEBLOCKS_SECRET_KEY: z.string().trim().min(1),
});

export const serverEnv = serverEnvSchema.safeParse({
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  LIVEBLOCKS_SECRET_KEY: process.env.LIVEBLOCKS_SECRET_KEY,
});
