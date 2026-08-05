import { NextRequest, NextResponse } from "next/server"
import { getDb, normalizeDoc } from "@/lib/server-db"

export async function GET() {
  try {
    const db = await getDb()
    const docs = await db.collection("attendances").find({}).toArray()
    return NextResponse.json({ records: docs.map(normalizeDoc) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { date, records } = body
    const db = await getDb()
    if (records && records.length > 0) {
      const docs = records.map((r: any) => ({
        id: crypto.randomUUID(),
        student_id: r.studentId || r.alunoId,
        date,
        status: r.status,
        created_at: new Date().toISOString(),
      }))
      await db.collection("attendances").insertMany(docs)
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
