import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { Toaster } from "sonner";
import ModalProvider from "@/providers/modal-provider";
import { Suspense } from "react";
import Loading from "@/components/auth/loading";
import PwaRegister from "@/components/pwa-register";


export const metadata: Metadata = {
  title: "Flowboard | Visual collaboration workspace",
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
    <html lang="en">
      <body>
        <PwaRegister />
        <Suspense fallback={<Loading />}>
          <ConvexClientProvider>
            <Toaster />
            <ModalProvider />
            {children}
          </ConvexClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
