import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  // 5 sign-ups per IP per 10 minutes.
  const limit = rateLimit(`register:${ip}`, 5, 10 * 60_000);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Avoid leaking which emails exist with a generic message.
    return NextResponse.json(
      { error: "An account with this email may already exist." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, email: true },
  });

  await audit("AUTH_REGISTER", {
    userId: user.id,
    ipAddress: ip,
    userAgent: req.headers.get("user-agent"),
    metadata: { email },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
