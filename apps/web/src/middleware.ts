import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { publicEnv, setupMessage } from "@/lib/public-env";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

const authenticatedMiddleware = clerkMiddleware(
  async (auth, request) => {
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  }
);

// Fail closed before Clerk or a protected route can run without configuration.
export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!publicEnv.success || !process.env.CLERK_SECRET_KEY?.trim()) {
    const headers = { "Cache-Control": "no-store" };
    if (/^\/(api|trpc)(\/|$)/.test(request.nextUrl.pathname)) {
      return NextResponse.json(
        { error: "Workspace services are not configured." },
        { status: 503, headers },
      );
    }
    return new NextResponse(
      '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Flowboard | Setup required</title></head><body style="margin:0;background:#020617;color:#e2e8f0;font-family:system-ui;display:grid;min-height:100vh;place-items:center"><main style="max-width:600px;margin:24px;padding:32px;border:1px solid #155e75;border-radius:20px"><p style="color:#67e8f9">FLOWBOARD</p><h1>Connect your workspace</h1><p style="line-height:1.8">' + setupMessage + '</p></main></body></html>',
      { status: 503, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } },
    );
  }
  return authenticatedMiddleware(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Clerk's frontend API proxy routes
    "/__clerk/(.*)",
  ],
};
