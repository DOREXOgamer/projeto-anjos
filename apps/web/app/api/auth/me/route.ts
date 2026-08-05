import { NextRequest, NextResponse } from "next/server"
import { getUserByToken } from "@/lib/server-db"

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const user = await getUserByToken(token)
    return NextResponse.json({ user })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid token" }, { status: 401 })
  }
}
