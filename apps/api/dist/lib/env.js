import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();
const envSchema = z.object({
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(16),
    PORT: z.string().optional(),
    CORS_ORIGIN: z.string().optional(),
});
export const env = envSchema.parse(process.env);
const parsedPort = env.PORT ? Number(env.PORT) : 4000;
export const port = Number.isFinite(parsedPort) ? parsedPort : 4000;
