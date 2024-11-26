import { ServerWebSocket } from "bun"
import { contentMap } from "@gotpop-platform/package-markdown"
import { getRelativePaths } from "./build"
import { logger } from "@gotpop-platform/package-logger"
import { rebuildFiles } from "./build"
import store from "./store"
import { watch } from "fs/promises"

export interface WatcherProps {
  clients: Set<ServerWebSocket<unknown>>
  scriptPaths: Record<string, string>[]
}

export async function watcher({ clients, scriptPaths }: WatcherProps) {
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

      store.currentContent = await contentMap()

      for (const client of clients) {
        client.send("reload")
      }
    }
  }
}
