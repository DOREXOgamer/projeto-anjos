import { app } from "./app.js";
import { client } from "./lib/db.js";
import { port } from "./lib/env.js";
async function start() {
    try {
        // Try connecting to MongoDB on startup to fail-fast if offline or misconfigured
        await client.connect();
        console.log("Connected to MongoDB Atlas successfully");
        const server = app.listen(port, () => {
            console.log(`API listening on http://localhost:${port}`);
        });
        const shutdown = async () => {
            await client.close();
            server.close(() => {
                process.exit(0);
            });
        };
        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
    }
    catch (err) {
        console.error("Failed to connect to MongoDB on startup:", err);
        process.exit(1);
    }
}
start();
