import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

async function verifyAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token || token.role !== "ADMIN") return null
  return token
}

// GET /api/admin/companies/:id/notes
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: "Missing id parameter" }, { status: 400 })

    // Check company exists
    const company = await db.company.findUnique({ where: { id }, select: { id: true } })
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 })

    const notes = await db.companyNote.findMany({
      where: { companyId: id },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error("[GET /api/admin/companies/[id]/notes]", error)
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 })
  }
}

// POST /api/admin/companies/:id/notes
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: "Missing id parameter" }, { status: 400 })

    // Check company exists
    const company = await db.company.findUnique({ where: { id }, select: { id: true } })
    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 })

    const body = await req.json()
    const { content, isPinned } = body

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Note content is required" }, { status: 400 })
    }

    const note = await db.companyNote.create({
      data: {
        companyId: id,
        authorId: (admin.sub as string) || null,
        authorName: (admin.name as string) || null,
        authorEmail: (admin.email as string) || null,
        content: content.trim(),
        isPinned: typeof isPinned === "boolean" ? isPinned : false,
      },
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/companies/[id]/notes]", error)
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 })
  }
}

// DELETE /api/admin/companies/:id/notes
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin(req)
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    if (!id) return NextResponse.json({ error: "Missing id parameter" }, { status: 400 })

    const body = await req.json()
    const { noteId } = body

    if (!noteId) {
      return NextResponse.json({ error: "noteId is required" }, { status: 400 })
    }

    // Verify the note belongs to the company
    const note = await db.companyNote.findFirst({
      where: { id: noteId, companyId: id },
    })

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    await db.companyNote.delete({
      where: { id: noteId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/companies/[id]/notes]", error)
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 })
  }
}
