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
import ModalProvider from "@/providers/modal-provider";
import { publicEnv, setupMessage } from "@/lib/public-env";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

interface ConvexClientProviderProps {
  children: React.ReactNode;
  authConfigured: boolean;
}

const convex = publicEnv.success
  ? new ConvexReactClient(publicEnv.data.NEXT_PUBLIC_CONVEX_URL)
  : null;

export const ConvexClientProvider = ({
  children,
  authConfigured,
}: ConvexClientProviderProps) => {
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const dark = resolvedTheme === "dark";
  if (pathname === "/welcome") return <>{children}</>;
  if (!authConfigured || !publicEnv.success || !convex) {
    if (/^\/sign-(in|up)(\/|$)/.test(pathname)) return <>{children}</>;
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
    <ClerkProvider publishableKey={publicEnv.data.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY} appearance={{ variables: {
      colorPrimary: dark ? "#a5b4fc" : "#4262ff",
      colorPrimaryForeground: dark ? "#11182e" : "#ffffff",
      colorBackground: dark ? "#11182e" : "#ffffff",
      colorForeground: dark ? "#edf1ff" : "#0f172a",
      colorMutedForeground: dark ? "#b6c1de" : "#475569",
      colorNeutral: dark ? "#edf1ff" : "#0f172a",
      colorInput: dark ? "#18213a" : "#ffffff",
      colorInputForeground: dark ? "#edf1ff" : "#0f172a",
    } }}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <Authenticated><ModalProvider />{children}</Authenticated>
        <Unauthenticated>{children}</Unauthenticated>
        <AuthLoading>
          <Loading />
        </AuthLoading>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};
