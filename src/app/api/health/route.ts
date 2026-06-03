import { NextResponse } from "next/server";

// Lightweight liveness probe for load balancers / uptime checks.
export async function GET() {
  return NextResponse.json({ status: "ok", time: new Date().toISOString() });
}
