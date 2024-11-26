import { clients, handleWSClose, handleWSMessage, handleWSOpen } from "./websocket"

import type { ServerConfig } from "types"
import { buildConfig } from "./build"
import { contentMap } from "@gotpop-platform/package-markdown"
import { handleGetPages } from "./router"
import { handleRequests } from "./handleRequests"
import { handleStaticAssets } from "./handleAssets"
import { logger } from "@gotpop-platform/package-logger"
import store from "./store"
import { watcher } from "./watcher"

const { env } = process
store.buildResponse = await Bun.build(buildConfig)

const serverConfig = (): ServerConfig => ({
  hostname: "::",
  development: env.NODE_ENV === "development",
  port: Number(env.npm_package_config_app_port) || 2000,
})

export async function startServer(Config: any) {
  store.currentContent = await contentMap()

  const server = Bun.serve({
    ...serverConfig(),
    async fetch(request: Request, server) {
      // Probably need to return this
      // handleRequests({ request, server })

      const url = new URL(request.url)

      // Websocket upgrade
      if (request.headers.get("upgrade") === "websocket") {
        const success = server.upgrade(request)

        if (!success) {
          return new Response("Websocket upgrade failed", { status: 400 })
        }
        return undefined
      }

      // Static assets
      if (url.pathname.startsWith("/assets/")) {
        const assetResponse = await handleStaticAssets({
          path: url.pathname,
          publicDir: env.npm_package_config_dir_public || "./public",
        })

        if (assetResponse) return assetResponse
      }

      // Page handling
      try {
        return await handleGetPages({
          request,
          allContent: store.currentContent,
          scriptPaths: store.scriptPaths,
        })
      } catch (error) {
        logger({ msg: `Error handling page: ${error}`, styles: ["red"] })

        return new Response("Internal Server Error", { status: 500 })
      }
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
    { msg: `http://localhost:${env.npm_package_config_app_port}`, styles: ["dim"] }
  )
}
