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
  const isAuthenticationPage = /^\/sign-(in|up)(\/|$)/.test(pathname);
  if (!authConfigured || !publicEnv.success || !convex) {
    if (isAuthenticationPage) return <>{children}</>;
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
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up" signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/" publishableKey={publicEnv.data.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY} appearance={{ variables: {
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
        <Unauthenticated>{isAuthenticationPage ? children : (
          <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <section className="max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <h1 className="text-2xl font-semibold">Workspace connection unavailable</h1>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Your sign-in could not connect to this workspace. Reconnect to try again. If this continues, contact your workspace administrator.</p>
              <button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">Reconnect</button>
            </section>
          </main>
        )}</Unauthenticated>
        <AuthLoading>
          <Loading />
        </AuthLoading>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};
