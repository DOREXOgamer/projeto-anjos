import { app } from "./app";
import { prisma } from "./lib/db";
import { port } from "./lib/env";
const server = app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
});
const shutdown = async () => {
    await prisma.$disconnect();
    server.close(() => {
        process.exit(0);
    });
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
