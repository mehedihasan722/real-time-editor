import { NextResponse } from "next/server";
import { publicEnv } from "@/lib/public-env";
import { serverEnv } from "@/lib/server-env";

export const dynamic = "force-dynamic";

export function GET() {
  const ready = publicEnv.success && serverEnv.success;
  return NextResponse.json(
    {
      status: ready ? "ok" : "not_ready",
      service: "flowboard-web",
      timestamp: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
