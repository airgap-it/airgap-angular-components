export interface SymbolInput {
  value: string
  caseSensitive: boolean
}

interface BaseSymbolType<T extends string> {
  kind: T
}

type BaseSymbolValue<T extends string> = BaseSymbolType<T>

export type DefaultSymbolType = BaseSymbolType<'default'>
export type DefaultSymbolValue = BaseSymbolValue<'default'> & DefaultSymbolType

export interface AssetSymbolType extends BaseSymbolType<'asset'> {
  symbolInput: SymbolInput
  extension: 'svg' | 'png'
}
export type AssetSymbolValue = BaseSymbolValue<'asset'> & AssetSymbolType

export interface LazySymbolType extends BaseSymbolType<'lazy'> {
  symbolInput: SymbolInput
}
export interface LazySymbolValue extends BaseSymbolValue<'lazy'>, LazySymbolType {
  url?: string
}

export type SymbolType = DefaultSymbolType | AssetSymbolType | LazySymbolType
export type SymbolValue = DefaultSymbolValue | AssetSymbolValue | LazySymbolValue

export interface SymbolSrc {
  value: SymbolValue
  fallbackType?: SymbolType
}
