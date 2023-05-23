export interface IsolatedModuleManifest {
  name: string
  version: string
  author: string
  url?: string
  email?: string
  repository?: string
  publicKey: string
  description: string
  src?: {
    namespace?: string
  }
  res?: {
    symbol?: {
      [key: string]: string
    }
  }
  include: string[]
  jsenv?: {
    android?: 'webview' | 'javascriptengine'
    ios?: 'webview'
  }
}
