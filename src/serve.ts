import { handleGetPages, handleStaticAssets } from "."

import type { BuildOutput } from "bun"
import { ServerWebSocket } from "bun"
import { contentMap } from "@gotpop-platform/package-markdown"
import { createCopyFilesPlugin } from "@gotpop-platform/bun-plugin-copy-assets"
import { logger } from "@gotpop-platform/package-logger"
import { watch } from "fs/promises"

type ContentMap = Map<string, unknown>
type WSMessage = string | Buffer

interface ServerConfig {
  hostname: string
  development: boolean
  port: number
}

const buildConfig = {
  entrypoints: [
    "src/assets/js/script.ts",
    "src/assets/js/worklets/worklet.grid.ts",
    "src/assets/js/worklets/worklet.hero.ts",
  ],
  outdir: "dist",
  root: "./src",
  naming: "[dir]/[name]-[hash].[ext]",
  experimentalCss: true,
  plugins: [
    createCopyFilesPlugin({
      inputDir: "src/assets",
      outputDir: "dist/assets",
      directories: ["fonts", "img", "styles"],
      preserveStructure: true,
      verbose: false,
      silent: false,
      onFile: async (src, dest) => {
        console.log(`Processing: ${src}`)
      },
    }),
  ],
}

// State
const clients = new Set<ServerWebSocket<unknown>>()
let currentContent: ContentMap
let buildResponse = await Bun.build(buildConfig)

// Websocket handlers
const handleWSOpen = (ws: ServerWebSocket<unknown>): void => {
  clients.add(ws)
  logger({ msg: "Client connected", styles: ["green"] })
}

const handleWSClose = (ws: ServerWebSocket<unknown>): void => {
  clients.delete(ws)
  logger({ msg: "Client disconnected", styles: ["yellow"] })
}

const handleWSMessage = (ws: ServerWebSocket<unknown>, message: WSMessage): void => {
  logger({ msg: `Received: ${message}`, styles: ["dim"] })
}

export const getRelativePaths = (response: BuildOutput) => {
  const baseDir = process.cwd() + "/dist"

  return response.outputs.map((output) => {
    const rootPath = output.path.replace(baseDir, "/").replace(/^\//, "")

    const entryPoint =
      output.path
        .split("/")
        .pop()
        ?.replace(/-[a-z0-9]+\.js$/, ".ts") || ""

    const type = output.path.includes("worklet.") ? "worklet" : "script"

    logger({ msg: "Build complete", styles: ["green", "bold"] })
    logger({ msg: "Output:", styles: ["dim"] }, { msg: rootPath, styles: ["blue"] })

    return {
      entryPoint,
      hashedPath: rootPath,
      type,
    }
  })
}

export async function rebuildFiles() {
  try {
    buildResponse = await Bun.build(buildConfig)

    return { success: true, buildResponse }
  } catch (error) {
    logger({ msg: `Build failed: ${error}`, styles: ["red"] })
    return { success: false, error }
  }
}

export async function startServer(Config: any) {
  // Content loading with error handling
  const loadContent = async (): Promise<ContentMap> => {
    try {
      currentContent = await contentMap({ DIR_CONTENT: Config.SERVER.DIR_CONTENT })
      return currentContent
    } catch (error) {
      logger({ msg: `Error loading content: ${error}`, styles: ["red"] })
      return new Map()
    }
  }

  // Server configuration
  const serverConfig: ServerConfig = {
    hostname: "::",
    development: process.env.NODE_ENV === "development",
    port:
      typeof Config.SERVER.PORT === "string"
        ? parseInt(Config.SERVER.PORT, 10)
        : Config.SERVER.PORT,
  }

  let allContent = await loadContent()

  const server = Bun.serve({
    ...serverConfig,
    async fetch(request: Request, server) {
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
          publicDir: Config.SERVER.PUBLIC_DIR,
        })
        if (assetResponse) return assetResponse
      }

      // Page handling
      try {
        return await handleGetPages({ request, allContent, scriptPaths, Config })
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

  watcher({ allContent, clients, loadContent })

  logger(
    { msg: "Server running at:", styles: ["green", "bold"] },
    { msg: `http://localhost:${Config.SERVER.PORT}`, styles: ["dim"] }
  )

  const scriptPaths: Record<string, string>[] = getRelativePaths(buildResponse)

  async function watcher({
    clients,
    loadContent,
  }: {
    allContent: Map<string, any>
    clients: Set<ServerWebSocket<unknown>>
    loadContent: () => Promise<any>
  }) {
    const watcher = watch(".", { recursive: true })

    for await (const event of watcher) {
      if (event.filename?.includes("src")) {
        logger({ msg: `Content changed: ${event.filename}`, styles: ["yellow"] })

        if (event.filename.match(/\.(css|js|ts)$/)) {
          const { success, buildResponse } = await rebuildFiles()

          if (success) {
            logger({ msg: "Build successful", styles: ["green"] })
            scriptPaths.length = 0

            if (buildResponse) {
              scriptPaths.push(...getRelativePaths(buildResponse))
            }
          }
        }

        allContent = await loadContent()

        for (const client of clients) {
          client.send("reload")
        }
      }
    }
  }
}
