/*
 * Public API Surface of core
 */

// Core module
export * from './lib/airgap-angular-core.module'

// Base
export * from './lib/base/base.component'
export * from './lib/base/base.facade'

// Components
export * from './lib/components/components.module'
export * from './lib/components/currency-symbol/currency-symbol.component'
export * from './lib/components/currency-symbol/currency-symbol.facade'
export * from './lib/components/currency-symbol/currency-symbol.types'
export * from './lib/components/from-to/from-to.component'
export * from './lib/components/iac-qr/iac-qr.component'
export * from './lib/components/identicon/identicon.component'
export * from './lib/components/network-badge/network-badge.component'
export * from './lib/components/titled-address/titled-address.component'
export * from './lib/components/titled-text/titled-text.component'
export * from './lib/components/account-item/account-item.component'
export * from './lib/components/account-selection/account-selection.component'
export * from './lib/components/qr/qr.component'
export * from './lib/components/qr-settings/qr-settings.component'

// Config
export * from './lib/config/app-config'

// Translation
export * from './lib/translation/AirGapTranslateLoader'

// Pipes
export * from './lib/pipes/pipes.module'
export * from './lib/pipes/amount-converter/amount-converter.pipe'
export * from './lib/pipes/fee-converter/fee-converter.pipe'
export * from './lib/pipes/wallet-filter/wallet-filter.pipe'

// Protocol
export * from './lib/protocol/isolated/block-explorer-isolated'
export * from './lib/protocol/isolated/protocol-offline-isolated'
export * from './lib/protocol/isolated/protocol-online-isolated'
export * from './lib/protocol/isolated/v3-serializer-companion-isolated'
export * from './lib/protocol/adapter/protocol-v0-adapter'

// Services
export * from './lib/services/address/address.service'
export * from './lib/services/clipboard/clipboard.service'
export * from './lib/services/deeplink/deeplink.service'
export * from './lib/services/filesystem/filesystem.service'
export * from './lib/services/iac/base.iac.service'
export * from './lib/services/iac/message-handler'
export * from './lib/services/iac/message-handler-single'
export * from './lib/services/isolated-modules/isolated-modules.service'
export * from './lib/services/key-pair/key-pair.service'
export * from './lib/services/language/language.service'
export * from './lib/services/permissions/permissions.service'
export * from './lib/services/protocol/protocol.service'
export * from './lib/services/protocol/store/main/main-protocol-store.service'
export * from './lib/services/protocol/store/sub/sub-protocol-store.service'
export * from './lib/services/protocol/tokens'
export * from './lib/services/qr-scanner/qr-scanner.service'
export * from './lib/services/serializer/serializer.service'
export * from './lib/services/storage/base.storage'
export * from './lib/services/storage/storage.service'
export * from './lib/services/transaction/transaction.service'
export * from './lib/services/ui-event/ui-event.service'
export * from './lib/services/ui-event-elements/ui-event-elements.service'
export * from './lib/services/uri/uri.service'

// Types
export * from './lib/types/isolated-modules/IsolatedModule'
export * from './lib/types/isolated-modules/IsolatedModuleManifest'
export * from './lib/types/isolated-modules/IsolatedModuleMetadata'
export * from './lib/types/ui/UIAction'
export * from './lib/types/ui/UIResource'
export * from './lib/types/Either'
export * from './lib/types/ExternalAliasResolver'
export * from './lib/types/SupportedLanguage'
export * from './lib/types/Token'

// Utils
export * from './lib/utils/isolated-modules/isolated-modules-metadata'
export * from './lib/utils/protocol/delegation'
export * from './lib/utils/protocol/protocol-identifier'
export * from './lib/utils/protocol/protocol-network-identifier'
export * from './lib/utils/airgap-transaction'
export * from './lib/utils/array'
export * from './lib/utils/ExposedPromise'
export * from './lib/utils/not-initialized'
export * from './lib/utils/utils'

// Capacitor
export * from './lib/capacitor-plugins/definitions'
export * from './lib/capacitor-plugins/injection-tokens'
export { IsolatedModules as WebIsolatedModules } from './lib/capacitor-plugins/isolated-modules/isolated-modules.plugin'
