import { file } from "bun"
import { join } from "path"
import { logger } from "@gotpop-platform/package-logger"

export async function handleStaticAssets({ path, publicDir }: { path: string; publicDir: string }) {
  const fullPath = join(process.cwd(), publicDir, path)

  try {
    const asset = file(fullPath)

    if (await asset.exists()) {
      return new Response(asset)
    }
  } catch (error) {
    logger({ msg: `Asset not found: ${path}`, styles: ["red"] })
  }
  return null
}
