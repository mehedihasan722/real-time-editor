"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import {
  AuthLoading,
  Authenticated,
  ConvexReactClient,
  Unauthenticated,
} from "convex/react";
import Loading from "@/components/auth/loading";
import { publicEnv, setupMessage } from "@/lib/public-env";

interface ConvexClientProviderProps {
  children: React.ReactNode;
}

const convex = publicEnv.success
  ? new ConvexReactClient(publicEnv.data.NEXT_PUBLIC_CONVEX_URL)
  : null;

export const ConvexClientProvider = ({
  children,
}: ConvexClientProviderProps) => {
  if (!publicEnv.success || !convex) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-8 text-slate-100">
        <section className="max-w-xl space-y-4 rounded-2xl border border-cyan-400/30 p-8">
          <h1 className="text-2xl font-semibold">Connect your workspace</h1>
          <p className="leading-7 text-slate-300">{setupMessage}</p>
        </section>
      </main>
    );
  }

  return (
    <ClerkProvider publishableKey={publicEnv.data.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <Authenticated>{children}</Authenticated>
        <Unauthenticated>{children}</Unauthenticated>
        <AuthLoading>
          <Loading />
        </AuthLoading>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};
