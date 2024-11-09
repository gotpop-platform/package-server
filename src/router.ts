import {
  INTERNAL_SERVER_ERROR_RESPONSE,
  NOT_FOUND_RESPONSE,
  importModule,
} from "./routerHelpers";
import {
  PAGES_DIR,
  ROUTER_STYLE,
} from "../../../sites/site-baseline/src/constants";

import { handleGetAssets } from ".";
import { logger } from "@gotpop-platform/package-logger";

export const router = new Bun.FileSystemRouter({
  style: ROUTER_STYLE,
  dir: PAGES_DIR,
});

const assetExtensions = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "svg",
  "css",
  "js",
  "woff",
  "woff2",
]);

export async function servePagesOrAssets(request: Request) {
  const url = new URL(request.url);
  const extension = url.pathname.split(".").pop()?.toLowerCase();

  if (extension && assetExtensions.has(extension)) {
    return handleGetAssets(url);
  }

  return handleGetPages(request);
}

export const handleGetPages = async (request: Request): Promise<Response> => {
  try {
    const route = router.match(request);

    if (!route) {
      return NOT_FOUND_RESPONSE;
    }

    const module = await importModule(route.filePath);

    if (!module) {
      return NOT_FOUND_RESPONSE;
    }

    if (typeof module.default !== "function") {
      logger({
        msg: "Default export is not a function:",
        styles: ["bold", "red"],
      });

      return INTERNAL_SERVER_ERROR_RESPONSE;
    }

    const response = await module.default(route.query).catch((error: Error) => {
      logger({ msg: String(error), styles: ["bold", "red"] });

      return null;
    });

    if (!response) {
      return NOT_FOUND_RESPONSE;
    }

    return new Response(response, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    logger({ msg: String(error), styles: ["bold", "red"] });

    return INTERNAL_SERVER_ERROR_RESPONSE;
  }
};
