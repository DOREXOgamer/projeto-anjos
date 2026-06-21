import { MongoClient, ObjectId } from "mongodb"
import { env } from "./env.js"
import dns from "dns"

dns.setDefaultResultOrder("ipv4first")

export const client = new MongoClient(env.DATABASE_URL)
export const db = client.db()

export { ObjectId }

export enum Role {
  ADMIN = "ADMIN",
  DIRECTOR = "DIRECTOR",
  COORDINATOR = "COORDINATOR",
  SECRETARY = "SECRETARY",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
}

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.ADMIN]: ["alunos", "turmas", "presenca", "plano_aula", "calendario", "comunicacao", "notas"],
  [Role.DIRECTOR]: ["alunos", "turmas", "presenca", "plano_aula", "calendario", "comunicacao", "notas"],
  [Role.COORDINATOR]: ["alunos", "turmas", "presenca", "plano_aula", "calendario", "comunicacao", "notas"],
  [Role.SECRETARY]: ["alunos", "turmas", "presenca", "calendario", "comunicacao"],
  [Role.TEACHER]: ["presenca", "plano_aula", "calendario", "comunicacao", "notas", "turmas"],
  [Role.STUDENT]: [],
}
