import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.SUPABASE_URL || "https://izkkgarmlvgregktdids.supabase.co";
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_fG_E34djPcx2VZHT7YvNDw_6EOmHQCo";
export const supabase = createClient(supabaseUrl, supabaseKey);
export class ObjectId {
    idStr;
    constructor(id) {
        this.idStr = id || crypto.randomUUID();
    }
    toString() {
        return this.idStr;
    }
    static isValid(id) {
        return typeof id === "string" && id.length > 0;
    }
}
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
