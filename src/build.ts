import { BuildOutput } from "bun"
import { ContentMap } from "types"
import { contentMap } from "@gotpop-platform/package-markdown"
import { createCopyFilesPlugin } from "@gotpop-platform/bun-plugin-copy-assets"
import { logger } from "@gotpop-platform/package-logger"
import store from "./store"

export const buildConfig = {
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
    store.buildResponse = await Bun.build(buildConfig)

    return { success: true, buildResponse: store.buildResponse }
  } catch (error) {
    logger({ msg: `Build failed: ${error}`, styles: ["red"] })
    return { success: false, error }
  }
}

// delete this function
export const loadContent = async () => {
  try {
    store.currentContent = await contentMap()

    return store.currentContent
  } catch (error) {
    logger({ msg: `Error loading content: ${error}`, styles: ["red"] })
    return new Map()
  }
}
