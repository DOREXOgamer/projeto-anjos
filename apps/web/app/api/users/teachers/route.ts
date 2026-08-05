import { NextRequest, NextResponse } from "next/server"
import { getDb, normalizeDoc } from "@/lib/server-db"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const db = await getDb()
    const docs = await db.collection("users").find({ role: { $ne: "STUDENT" } }).toArray()
    const teachers = docs.map(normalizeDoc)
    return NextResponse.json({ teachers })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const db = await getDb()
    const passwordHash = await bcrypt.hash(body.password || "123456", 10)
    const newId = crypto.randomUUID()
    const newDoc = { id: newId, ...body, password: passwordHash, created_at: new Date().toISOString() }
    await db.collection("users").insertOne(newDoc)
    return NextResponse.json({ user: normalizeDoc(newDoc) }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
