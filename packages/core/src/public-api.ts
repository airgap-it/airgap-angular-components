/*
 * Public API Surface of core
 */

export * from './lib/airgap-angular-core.module'

export * from './lib/components/components.module'
export * from './lib/components/currency-symbol/currency-symbol.component'
export * from './lib/components/from-to/from-to.component'
export * from './lib/components/identicon/identicon.component'
export * from './lib/components/network-badge/network-badge.component'
export * from './lib/components/titled-address/titled-address.component'
export * from './lib/components/titled-text/titled-text.component'

export * from './lib/translation/AirGapTranslateLoader'

export * from './lib/pipes/pipes.module'
export * from './lib/pipes/amount-converter/amount-converter.pipe'
export * from './lib/pipes/fee-converter/fee-converter.pipe'

export * from './lib/services/language/language.service'
export * from './lib/services/protocol/protocol.service'
export * from './lib/services/protocol/store/main/main-protocol-store.service'
export * from './lib/services/protocol/store/sub/sub-protocol-store.service'
export * from './lib/services/protocol/tokens'

export * from './lib/types/SupportedLanguage'
export * from './lib/types/Token'

export * from './lib/utils/array/remove-duplicates'
export * from './lib/utils/protocol/protocol-identifier'
export * from './lib/utils/protocol/protocol-network-identifier'
export * from './lib/utils/not-initialized'

