export interface IsolatedModuleManifest {
  name: string
  version: string
  author: string
  signature: string
  src?: {
    namespace?: string
  }
  res?: {
    symbol?: string
  }
  include: string[]
  jsenv?: {
    android?: 'webview' | 'javascriptengine'
    ios?: 'webview'
  }
}
