import type { ServerWebSocket } from "bun"

export type ContentMap = Map<string, unknown>
export type WSMessage = string | Buffer

export interface ServerConfig {
  hostname: string
  development: boolean
  port: number
}
