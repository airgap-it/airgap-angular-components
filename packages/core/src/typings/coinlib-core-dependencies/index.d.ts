// Ambient typings for untyped modules vendored by @airgap/coinlib-core.
// Shapes mirror bs58check@2.1.2 and rlp@2.2.3.

declare module '@airgap/coinlib-core/dependencies/src/bs58check-2.1.2/index' {
  export function encode(payload: Buffer): string
  export function decode(str: string): Buffer
  export function decodeUnsafe(str: string): Buffer | undefined
}

declare module '@airgap/coinlib-core/dependencies/src/rlp-2.2.3/index' {
  export type Input = Buffer | string | number | bigint | Uint8Array | Input[] | null | undefined
  export type Decoded = Buffer | Buffer[] | Decoded[]
  export function encode(input: Input): Buffer
  export function decode(input: Buffer | string | Uint8Array, stream?: boolean): Decoded
  export function getLength(input: Buffer | string | Uint8Array): number
}
