import { INTERNAL_SERVER_ERROR_RESPONSE, NOT_FOUND_RESPONSE, importModule } from "./routerHelpers"

import { logger } from "@gotpop-platform/package-logger"

const router = new Bun.FileSystemRouter({
  style: "nextjs",
  dir: process.cwd() + "/src/pages",
})

export const handleGetPages = async <T>(data: {
  request: Request
  allContent: Map<string, any>
  scriptPaths: Record<string, string>[]
  Config: T
}): Promise<Response> => {
  try {
    const route = router.match(data.request)

    if (!route) {
      return NOT_FOUND_RESPONSE
    }

    const module = await importModule(route.filePath)

    if (!module) {
      return NOT_FOUND_RESPONSE
    }

    if (typeof module.default !== "function") {
      logger({
        msg: "Default export is not a function:",
        styles: ["bold", "red"],
      })

      return INTERNAL_SERVER_ERROR_RESPONSE
    }

    const response = await module
      .default({
        ...data,
        query: route.params,
      })
      .catch((error: Error) => {
        logger({ msg: String(error), styles: ["bold", "red"] })

        return null
      })

    if (!response) {
      return NOT_FOUND_RESPONSE
    }

    return new Response(response, {
      headers: { "Content-Type": "text/html" },
    })
  } catch (error) {
    logger({ msg: String(error), styles: ["bold", "red"] })

    return INTERNAL_SERVER_ERROR_RESPONSE
  }
}
