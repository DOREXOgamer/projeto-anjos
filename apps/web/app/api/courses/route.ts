import { NextResponse } from "next/server"
import { getDb, normalizeDoc } from "@/lib/server-db"

export async function GET() {
  try {
    const db = await getDb()
    const docs = await db.collection("courses").find({}).toArray()
    const courses = docs.map(normalizeDoc)
    return NextResponse.json({ courses })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
