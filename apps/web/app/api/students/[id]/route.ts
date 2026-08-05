import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/server-db"
import { ObjectId as MongoObjectId } from "mongodb"

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const body = await req.json()
    const db = await getDb()
    await db.collection("students").updateOne(
      { $or: [{ id }, { _id: MongoObjectId.isValid(id) ? new MongoObjectId(id) : undefined }] },
      { $set: { ...body, updatedAt: new Date() } }
    )
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const db = await getDb()
    await db.collection("students").deleteOne({
      $or: [{ id }, { _id: MongoObjectId.isValid(id) ? new MongoObjectId(id) : undefined }],
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
