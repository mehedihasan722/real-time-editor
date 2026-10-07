import type { Metadata } from "next";
import "./globals.css";
import "./spatial-design.css";
import "./editorial-design.css";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { Toaster } from "@/components/ui/sonner";
import { Suspense } from "react";
import Loading from "@/components/auth/loading";
import PwaRegister from "@/components/pwa-register";
import { ThemeProvider } from "@/providers/theme-provider";
import { WorkspacePreferencesProvider } from "@/providers/workspace-preferences-provider";
import { MotionProvider } from "@/providers/motion-provider";
import { WorkspaceCommand } from "@/components/workspace-command";
import { WorkspaceAnalytics } from "@/components/workspace-analytics";
import { publicEnv } from "@/lib/public-env";


export const metadata: Metadata = {
  title: {
    default: "Flowboard",
    template: "%s | Flowboard",
  },
  description:
    "Create and collaborate on visual boards with your team.",
  applicationName: "Flowboard",
  appleWebApp: { capable: true, title: "Flowboard", statusBarStyle: "black-translucent" },
  icons: { apple: "/icon-192.png", icon: "/icon-192.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authConfigured = publicEnv.success && Boolean(process.env.CLERK_SECRET_KEY);
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <WorkspacePreferencesProvider><MotionProvider>
            <PwaRegister />
            <Suspense fallback={<Loading />}>
              <ConvexClientProvider authConfigured={authConfigured}>
                <Toaster />
                <WorkspaceCommand />
                <WorkspaceAnalytics />
                {children}
              </ConvexClientProvider>
            </Suspense>
          </MotionProvider></WorkspacePreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
