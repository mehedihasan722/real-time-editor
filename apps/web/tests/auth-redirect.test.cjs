const { test } = require("node:test");
const assert = require("node:assert/strict");
const load = require("./helpers/load-ts.cjs");

test("configured authentication uses branded routes and still protects workspace requests", async () => {
  let options, protectedRequests = 0;
  const { default: proxy } = load("src/proxy.ts", {
    "@clerk/nextjs/server": { clerkMiddleware: (handler, settings) => {
      options = settings;
      return request => handler({ protect: async () => { protectedRequests++; } }, request);
    } },
    "next/server": { NextResponse: { next: () => new Response() } },
    "@/lib/public-env": { publicEnv: { success: true } },
    "@/lib/server-env": { serverEnv: { success: true } },
  });
  assert.equal(options.signInUrl, "/sign-in");
  assert.equal(options.signUpUrl, "/sign-up");
  for (const pathname of ["/sign-in", "/sign-in/factor-one", "/sign-up"]) await proxy({ nextUrl: { pathname } });
  assert.equal(protectedRequests, 0);
  for (const pathname of ["/", "/board/private", "/api/assist"]) await proxy({ nextUrl: { pathname } });
  assert.equal(protectedRequests, 3);
});
