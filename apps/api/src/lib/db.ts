import { MongoClient, ObjectId as MongoObjectId } from "mongodb"
import dotenv from "dotenv"

dotenv.config()

const dbUrl =
  process.env.DATABASE_URL ||
  "mongodb://engsguilhermevieira_db_user:GJiY1s6dANVYBb8z@ac-jmnedzg-shard-00-00.bstpphz.mongodb.net:27017,ac-jmnedzg-shard-00-01.bstpphz.mongodb.net:27017,ac-jmnedzg-shard-00-02.bstpphz.mongodb.net:27017/projeto_anjos?ssl=true&authSource=admin&appName=Cluster0"

let client: MongoClient | null = null

export function getMongoClient(): MongoClient {
  if (!client) {
    client = new MongoClient(dbUrl)
  }
  return client
}

export class ObjectId {
  private idStr: string

  constructor(id?: string) {
    this.idStr = id || crypto.randomUUID()
  }

  toString() {
    return this.idStr
  }

  static isValid(id: any) {
    return typeof id === "string" && id.length > 0
  }
}

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

function normalizeDoc(doc: any): any {
  if (!doc) return doc
  const idStr = doc.id || (doc._id ? doc._id.toString() : crypto.randomUUID())
  return {
    ...doc,
    id: idStr,
    data_nascimento: doc.data_nascimento || doc.dataNascimento || "",
    dataNascimento: doc.dataNascimento || doc.data_nascimento || "",
    class_id: doc.class_id || doc.classId || null,
    classId: doc.classId || doc.class_id || null,
    class_ids: doc.class_ids || doc.classIds || [],
    classIds: doc.classIds || doc.class_ids || [],
    course_id: doc.course_id || doc.courseId || null,
    courseId: doc.courseId || doc.course_id || null,
    professor_id: doc.professor_id || doc.professorId || null,
    professorId: doc.professorId || doc.professor_id || null,
    student_id: doc.student_id || doc.studentId || doc.alunoId || null,
    studentId: doc.studentId || doc.student_id || doc.alunoId || null,
    created_at: doc.created_at || (doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString()),
    createdAt: doc.createdAt || doc.created_at || new Date().toISOString(),
    password: doc.password || doc.passwordHash || "",
  }
}

class MongoQueryBuilder implements PromiseLike<any> {
  private collectionName: string
  private filters: Record<string, any> = {}
  private sortOptions: Record<string, 1 | -1> = {}
  private limitValue?: number
  private isHeadOnly = false
  private countMode?: string
  private isDelete = false
  private updatePayload?: any

  constructor(collectionName: string) {
    this.collectionName = collectionName
  }

  select(_fields?: string, options?: { count?: string; head?: boolean }) {
    if (options?.head) {
      this.isHeadOnly = true
    }
    if (options?.count) {
      this.countMode = options.count
    }
    return this
  }

  eq(field: string, value: any) {
    if (field === "id") {
      if (typeof value === "string" && MongoObjectId.isValid(value) && value.length === 24) {
        this.filters["$or"] = [{ id: value }, { _id: new MongoObjectId(value) }]
      } else {
        this.filters["id"] = value
      }
    } else {
      this.filters[field] = value
    }
    return this
  }

  neq(field: string, value: any) {
    if (field === "id") {
      this.filters["id"] = { $ne: value }
    } else {
      this.filters[field] = { $ne: value }
    }
    return this
  }

  in(field: string, values: any[]) {
    if (field === "id") {
      const objectIds = values
        .filter((v) => typeof v === "string" && MongoObjectId.isValid(v) && v.length === 24)
        .map((v) => new MongoObjectId(v))
      this.filters["$or"] = [{ id: { $in: values } }, { _id: { $in: objectIds } }]
    } else {
      this.filters[field] = { $in: values }
    }
    return this
  }

  order(field: string, options?: { ascending?: boolean }) {
    const mongoField = field === "created_at" ? "createdAt" : field
    this.sortOptions[mongoField] = options?.ascending ? 1 : -1
    return this
  }

  limit(limit: number) {
    this.limitValue = limit
    return this
  }

  update(updateFields: any) {
    this.updatePayload = updateFields
    return this
  }

  delete() {
    this.isDelete = true
    return this
  }

  async single() {
    try {
      const client = getMongoClient()
      await client.connect()
      const db = client.db()
      const doc = await db.collection(this.collectionName).findOne(this.filters)
      if (!doc) {
        return { data: null, error: null }
      }
      return { data: normalizeDoc(doc), error: null }
    } catch (err: any) {
      return { data: null, error: err }
    }
  }

  async then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      const client = getMongoClient()
      await client.connect()
      const db = client.db()
      const col = db.collection(this.collectionName)

      if (this.isDelete) {
        await col.deleteMany(this.filters)
        const result = { data: null, error: null, status: 200 }
        return onfulfilled ? onfulfilled(result) : (result as any)
      }

      if (this.updatePayload !== undefined) {
        const setObj: any = { ...this.updatePayload, updatedAt: new Date() }
        await col.updateMany(this.filters, { $set: setObj })
        const result = { data: null, error: null, status: 200 }
        return onfulfilled ? onfulfilled(result) : (result as any)
      }

      if (this.isHeadOnly) {
        const count = await col.countDocuments(this.filters)
        const result = { data: null, count, error: null, status: 200 }
        return onfulfilled ? onfulfilled(result) : (result as any)
      }

      const docs = await col.find(this.filters).toArray()
      let normalized = docs.map(normalizeDoc)

      if (Object.keys(this.sortOptions).length > 0) {
        normalized.sort((a, b) => {
          for (const [key, dir] of Object.entries(this.sortOptions)) {
            const altKey = key === "createdAt" ? "created_at" : "createdAt"
            const valA = a[key] ?? a[altKey] ?? ""
            const valB = b[key] ?? b[altKey] ?? ""
            if (valA < valB) return dir === 1 ? -1 : 1
            if (valA > valB) return dir === 1 ? 1 : -1
          }
          return 0
        })
      }

      if (this.limitValue) {
        normalized = normalized.slice(0, this.limitValue)
      }

      const count = this.countMode ? normalized.length : undefined

      const result = { data: normalized, count, error: null, status: 200 }
      return onfulfilled ? onfulfilled(result) : (result as any)
    } catch (err: any) {
      if (onrejected) return onrejected(err)
      return Promise.reject(err)
    }
  }

  async insert(docOrDocs: any | any[]) {
    try {
      const client = getMongoClient()
      await client.connect()
      const db = client.db()
      const col = db.collection(this.collectionName)

      const docs = Array.isArray(docOrDocs) ? docOrDocs : [docOrDocs]
      const preparedDocs = docs.map((d) => {
        const id = d.id || crypto.randomUUID()
        return {
          ...d,
          id,
          _id: typeof id === "string" && MongoObjectId.isValid(id) && id.length === 24 ? new MongoObjectId(id) : id,
          createdAt: d.created_at || d.createdAt || new Date().toISOString(),
          updatedAt: new Date(),
        }
      })

      await col.insertMany(preparedDocs)
      return { data: preparedDocs.map(normalizeDoc), error: null }
    } catch (err: any) {
      return { data: null, error: err }
    }
  }
}

export const supabase = {
  from(collectionName: string) {
    return new MongoQueryBuilder(collectionName)
  },
}
