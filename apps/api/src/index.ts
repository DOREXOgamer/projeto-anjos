import { app } from "./app.js"
import { client } from "./lib/db.js"
import { port } from "./lib/env.js"

const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})

const shutdown = async () => {
  await client.close()
  server.close(() => {
    process.exit(0)
  })
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
