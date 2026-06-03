import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";
import { audit } from "@/lib/audit";

// GET /api/documents/:id — fetch a single document with its analysis.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const document = await prisma.document.findUnique({
    where: { id },
    include: { analysis: true },
  });
  // Ownership check (RBAC): only the owner or an admin may read.
  if (!document || (document.userId !== session.user.id && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ document });
}

// DELETE /api/documents/:id — remove a document, its analysis, and stored file.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document || (document.userId !== session.user.id && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await storage.delete(document.storageKey).catch(() => {});
  await prisma.document.delete({ where: { id } }); // cascades to analysis

  await audit("DOCUMENT_DELETE", {
    userId: session.user.id,
    metadata: { documentId: id },
  });
  return NextResponse.json({ ok: true });
}
