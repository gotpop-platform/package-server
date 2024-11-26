import { getRelativePaths } from "./build"

// store.ts
export interface ContentMap {
  // Define the structure of ContentMap here
}

class Store {
  private _currentContent: ContentMap | null = null
  private _buildResponse: any | null = null
  private _scriptPaths: Record<string, string>[] = []

  get currentContent(): ContentMap | null {
    return this._currentContent
  }

  set currentContent(content: ContentMap | null) {
    this._currentContent = content
  }

  get buildResponse(): any | null {
    return this._buildResponse
  }

  set buildResponse(response: any | null) {
    this._buildResponse = response

    if (response) {
      this._scriptPaths = getRelativePaths(response)
    }
  }

  get scriptPaths(): Record<string, string>[] {
    return this._scriptPaths
  }

  set scriptPaths(paths: Record<string, string>[]) {
    this._scriptPaths = paths
  }
}

const store = new Store()

export default store
