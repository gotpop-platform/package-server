import { ServerWebSocket } from "bun"
import { WSMessage } from "./types"
import { logger } from "@gotpop-platform/package-logger"

export const handleWSOpen = (ws: ServerWebSocket<unknown>): void => {
  clients.add(ws)
  logger({ msg: "Client connected", styles: ["green"] })
}

export const handleWSClose = (ws: ServerWebSocket<unknown>): void => {
  clients.delete(ws)
  logger({ msg: "Client disconnected", styles: ["yellow"] })
}

export const handleWSMessage = (ws: ServerWebSocket<unknown>, message: WSMessage): void => {
  logger({ msg: `Received: ${message}`, styles: ["dim"] })
}

export const clients = new Set<ServerWebSocket<unknown>>()
