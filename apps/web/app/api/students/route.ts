import { NextRequest, NextResponse } from "next/server"
import { getDb, normalizeDoc } from "@/lib/server-db"

export async function GET() {
  try {
    const db = await getDb()
    const docs = await db.collection("students").find({}).toArray()
    const students = docs.map(normalizeDoc)
    return NextResponse.json({ students })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const db = await getDb()
    const newId = crypto.randomUUID()
    const newDoc = {
      id: newId,
      nome: body.nome,
      cpf: body.cpf,
      data_nascimento: body.dataNascimento || body.data_nascimento,
      dataNascimento: body.dataNascimento || body.data_nascimento,
      email: body.email || "",
      telefone: body.telefone || "",
      endereco: body.endereco || "",
      curso: body.curso || "",
      class_id: body.classId || body.class_id || null,
      class_ids: body.classIds || body.class_ids || [],
      created_at: new Date().toISOString(),
    }
    await db.collection("students").insertOne(newDoc)
    return NextResponse.json({ student: normalizeDoc(newDoc) }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
