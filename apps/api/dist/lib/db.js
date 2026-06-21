import { MongoClient, ObjectId } from "mongodb";
import { env } from "./env.js";
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
export const client = new MongoClient(env.DATABASE_URL);
export const db = client.db();
export { ObjectId };
export var Role;
(function (Role) {
    Role["ADMIN"] = "ADMIN";
    Role["DIRECTOR"] = "DIRECTOR";
    Role["COORDINATOR"] = "COORDINATOR";
    Role["SECRETARY"] = "SECRETARY";
    Role["TEACHER"] = "TEACHER";
    Role["STUDENT"] = "STUDENT";
})(Role || (Role = {}));
export const ROLE_PERMISSIONS = {
    [Role.ADMIN]: ["alunos", "turmas", "presenca", "plano_aula", "calendario", "comunicacao", "notas"],
    [Role.DIRECTOR]: ["alunos", "turmas", "presenca", "plano_aula", "calendario", "comunicacao", "notas"],
    [Role.COORDINATOR]: ["alunos", "turmas", "presenca", "plano_aula", "calendario", "comunicacao", "notas"],
    [Role.SECRETARY]: ["alunos", "turmas", "presenca", "calendario", "comunicacao"],
    [Role.TEACHER]: ["presenca", "plano_aula", "calendario", "comunicacao", "notas", "turmas"],
    [Role.STUDENT]: [],
};
