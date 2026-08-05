import { NextResponse } from "next/server"
import { getDb, normalizeDoc } from "@/lib/server-db"

export async function GET() {
  try {
    const db = await getDb()
    const docs = await db.collection("events").find({}).toArray()
    const events = docs.map(normalizeDoc)
    return NextResponse.json({ events })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
