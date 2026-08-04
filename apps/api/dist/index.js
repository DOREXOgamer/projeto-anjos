import { app } from "./app.js";
import { port } from "./lib/env.js";
async function start() {
    try {
        const server = app.listen(port, () => {
            console.log(`API listening on http://localhost:${port} (Supabase Backend)`);
        });
        const shutdown = async () => {
            server.close(() => {
                process.exit(0);
            });
        };
        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
    }
    catch (err) {
        console.error("Failed to start API server:", err);
        process.exit(1);
    }
}
start();
