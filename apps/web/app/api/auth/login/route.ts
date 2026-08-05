import { NextRequest, NextResponse } from "next/server"
import { loginUser } from "@/lib/server-db"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body
    const result = await loginUser(email, password)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Credenciais inválidas" }, { status: 401 })
  }
}
