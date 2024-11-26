import type { Server } from "bun"
import { env } from "process"
import { handleGetPages } from "./router"
import { handleStaticAssets } from "./handleAssets"
import { logger } from "@gotpop-platform/package-logger"
import store from "./store"

export async function handleRequests({ request, server }: { request: Request; server: Server }) {
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
}
