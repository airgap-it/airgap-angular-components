declare module '@download/blockies' {
  export function createIcon(opts: {
    seed?: string
    color?: string
    bgcolor?: string
    spotcolor?: string
    size?: number
    scale?: number
  }): HTMLCanvasElement
}
