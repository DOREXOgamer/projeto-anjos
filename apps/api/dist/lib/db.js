import { MongoClient, ObjectId } from "mongodb";
import { env } from "./env.js";
import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
export const client = new MongoClient(env.DATABASE_URL);
export const db = client.db();
export { ObjectId };
export var Role;
(function (Role) {
    Role["DIRECTOR"] = "DIRECTOR";
    Role["TEACHER"] = "TEACHER";
})(Role || (Role = {}));
