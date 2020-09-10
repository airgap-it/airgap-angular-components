/*
 * Public API Surface of core
 */

// Core module
export * from './lib/airgap-angular-core.module'

// Components
export * from './lib/components/components.module'
export * from './lib/components/currency-symbol/currency-symbol.component'
export * from './lib/components/from-to/from-to.component'
export * from './lib/components/identicon/identicon.component'
export * from './lib/components/network-badge/network-badge.component'
export * from './lib/components/titled-address/titled-address.component'
export * from './lib/components/titled-text/titled-text.component'
export * from './lib/components/qr/qr.component'

// Translation
export * from './lib/translation/AirGapTranslateLoader'

// Pipes
export * from './lib/pipes/pipes.module'
export * from './lib/pipes/amount-converter/amount-converter.pipe'
export * from './lib/pipes/fee-converter/fee-converter.pipe'

// Services
export * from './lib/services/clipboard/clipboard.service'
export * from './lib/services/iac/base.iac.service'
export * from './lib/services/iac/message-handler'
export * from './lib/services/language/language.service'
export * from './lib/services/protocol/protocol.service'
export * from './lib/services/protocol/store/main/main-protocol-store.service'
export * from './lib/services/protocol/store/sub/sub-protocol-store.service'
export * from './lib/services/protocol/tokens'
export * from './lib/services/qr-scanner/qr-scanner.service'
export * from './lib/services/serializer/serializer.service'
export * from './lib/services/storage/base.storage'
export * from './lib/services/storage/storage.service'
export * from './lib/services/ui-event/ui-event.service'
export * from './lib/services/ui-event-elements/ui-event-elements.service'

// Types
export * from './lib/types/SupportedLanguage'
export * from './lib/types/Token'

// Utils
export * from './lib/utils/array/remove-duplicates'
export * from './lib/utils/protocol/protocol-identifier'
export * from './lib/utils/protocol/protocol-network-identifier'
export * from './lib/utils/not-initialized'
export * from './lib/utils/utils'

// Capacitor
export * from './lib/capacitor-plugins/injection-tokens'
