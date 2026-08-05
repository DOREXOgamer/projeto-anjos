import { NextResponse } from "next/server"
import { getDb } from "@/lib/server-db"

export async function GET() {
  try {
    const db = await getDb()
    const totalAlunos = await db.collection("students").countDocuments()
    const activeClasses = await db.collection("classes").countDocuments({ status: "ativa" })
    return NextResponse.json({
      stats: { totalAlunos, presentesHoje: 0, aulasDoDia: 0 },
      weeklyPresenca: [],
      riskStudents: [],
      totalStudents: totalAlunos,
      activeClasses,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
