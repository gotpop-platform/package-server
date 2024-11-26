import { clients, handleWSClose, handleWSMessage, handleWSOpen } from "./websocket"

import type { Server } from "bun"
import type { ServerConfig } from "types"
import { buildConfig } from "./build"
import { contentMap } from "@gotpop-platform/package-markdown"
import { handleRequests } from "./handleRequests"
import { logger } from "@gotpop-platform/package-logger"
import store from "./store"
import { watcher } from "./watcher"

const { env } = process
const DEFAULT_PORT = 2000

store.buildResponse = await Bun.build(buildConfig)

const serverConfig = (): ServerConfig => ({
  hostname: "::",
  development: env.NODE_ENV === "development",
  port: Number(env.npm_package_config_server_port) || DEFAULT_PORT,
})

export async function startServer() {
  store.currentContent = await contentMap()

  Bun.serve({
    ...serverConfig(),
    async fetch(request: Request, server: Server) {
      return handleRequests({ request, server })
    },
    websocket: {
      open: handleWSOpen,
      close: handleWSClose,
      message: handleWSMessage,
    },
  })

  watcher({ clients, scriptPaths: store.scriptPaths })

  logger(
    { msg: "Server running at:", styles: ["green", "bold"] },
    { msg: `http://localhost:${env.npm_package_config_server_port}`, styles: ["dim"] }
  )
}
