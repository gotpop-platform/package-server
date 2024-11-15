import { join } from "path"

export function handleGetAssets(url: URL) {
  const pathRenamedToPublic = join(process.cwd(), "dist", url.pathname)
  console.log("pathRenamedToPublic :", pathRenamedToPublic)
  const file = Bun.file(pathRenamedToPublic)

  const headers = {
    "Cache-Control": "max-age=31536000",
  }

  return new Response(file ?? "Not Found", {
    status: file ? 200 : 404,
    headers: headers ?? {},
  })
}

// export async function handleStaticAssets(path: string) {
//   const fullPath = join(process.cwd(), PUBLIC_DIR, path)
//   try {
//     const asset = file(fullPath)
//     if (await asset.exists()) {
//       return new Response(asset)
//     }
//   } catch (error) {
//     logger({ msg: `Asset not found: ${path}`, styles: ["red"] })
//   }
//   return null
// }
