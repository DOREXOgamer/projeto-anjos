import { NextRequest, NextResponse } from "next/server"
import { getDb, normalizeDoc } from "@/lib/server-db"
import { ObjectId as MongoObjectId } from "mongodb"

export async function GET() {
  try {
    const db = await getDb()
    const docs = await db.collection("classes").find({}).toArray()
    const classes = docs.map(normalizeDoc)
    return NextResponse.json({ classes })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const db = await getDb()
    const newId = crypto.randomUUID()
    const newDoc = { id: newId, ...body, created_at: new Date().toISOString() }
    await db.collection("classes").insertOne(newDoc)
    return NextResponse.json({ class: normalizeDoc(newDoc) }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
