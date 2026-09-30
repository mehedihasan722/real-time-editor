import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { Toaster } from "@/components/ui/sonner";
import ModalProvider from "@/providers/modal-provider";
import { Suspense } from "react";
import Loading from "@/components/auth/loading";
import PwaRegister from "@/components/pwa-register";
import { ThemeProvider } from "@/providers/theme-provider";
import { WorkspacePreferencesProvider } from "@/providers/workspace-preferences-provider";


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
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <WorkspacePreferencesProvider>
            <PwaRegister />
            <Suspense fallback={<Loading />}>
              <ConvexClientProvider>
                <Toaster />
                <ModalProvider />
                {children}
              </ConvexClientProvider>
            </Suspense>
          </WorkspacePreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
