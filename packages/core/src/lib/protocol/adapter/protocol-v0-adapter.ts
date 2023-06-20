/* eslint-disable max-lines */
/* eslint-disable max-classes-per-file */
import {
  CryptoClient,
  DelegateeDetails,
  DelegationDetails,
  DelegatorDetails,
  FeeDefaults as FeeDefaultsV0,
  IAirGapTransaction,
  IAirGapTransactionResult,
  ICoinDelegateProtocol,
  ICoinProtocol,
  ICoinSubProtocol,
  IProtocolTransactionCursor,
  NetworkType as NetworkTypeV0,
  ProtocolBlockExplorer as ProtocolBlockExplorerV0,
  ProtocolNetwork as ProtocolNetworkV0,
  ProtocolSymbols,
  SignedTransaction as SignedTransactionV0,
  SubProtocolSymbols,
  SubProtocolType as SubProtocolTypeV0,
  UnsignedTransaction as UnsignedTransactionV0
} from '@airgap/coinlib-core'
import { IProtocolAddressCursor, IAirGapAddressResult } from '@airgap/coinlib-core/interfaces/IAirGapAddress'
import { AirGapTransactionStatus as AirGapTransactionStatusV0 } from '@airgap/coinlib-core/interfaces/IAirGapTransaction'
import { ProtocolOptions as ProtocolOptionsV0 } from '@airgap/coinlib-core/utils/ProtocolOptions'
import { derive, mnemonicToSeed } from '@airgap/crypto'
import {
  AddressWithCursor,
  AirGapAnyProtocol,
  AirGapBlockExplorer,
  AirGapTransaction,
  AirGapTransactionStatus,
  AirGapTransactionsWithCursor,
  AirGapV3SerializerCompanion,
  Amount,
  Balance,
  BlockExplorerMetadata,
  canEncryptAES,
  canEncryptAsymmetric,
  canFetchDataForAddress,
  canFetchDataForMultipleAddresses,
  canSignMessage,
  CryptoConfiguration,
  CryptoDerivative,
  ExtendedKeyPair,
  ExtendedPublicKey,
  ExtendedSecretKey,
  FeeDefaults,
  FeeEstimation,
  hasConfigurableContract,
  hasMultiAddressPublicKeys,
  isAmount,
  isBip32Protocol,
  isMultiTokenSubProtocol,
  isOfflineProtocol,
  isOnlineProtocol,
  isTransactionStatusChecker,
  KeyPair,
  newAmount,
  newExtendedPublicKey,
  newExtendedSecretKey,
  newPublicKey,
  newSecretKey,
  newSignature,
  ProtocolConfiguration,
  ProtocolMetadata,
  ProtocolNetwork,
  ProtocolNetworkType,
  ProtocolSymbol,
  ProtocolUnitsMetadata,
  PublicKey,
  SecretKey,
  Signature,
  SignedTransaction,
  SubProtocol,
  SubProtocolType,
  TransactionCursor,
  TransactionDetails,
  UnsignedTransaction
} from '@airgap/module-kit'
import BigNumber from 'bignumber.js'
import { TransactionSignRequest, TransactionSignResponse, TransactionValidator } from '@airgap/serializer'
import { AirGapDelegateProtocol } from '@airgap/module-kit/internal'
import { isTezosSaplingProtocol } from '@airgap/tezos'
import { getProtocolOptionsByIdentifierLegacy } from '../../utils/protocol/protocol-options'
import { supportsV1Delegation } from '../../utils/protocol/delegation'
import {
  convertFeeDefaultsV1ToV0,
  convertNetworkTypeV1ToV0,
  convertTransactionDetailsV1ToV0,
  convertTransactionStatusV1ToV0,
  getBytesFormatV1FromV0,
  getPublicKeyType,
  getSecretKeyType
} from '../../utils/protocol/protocol-v0-adapter'

// ProtocolBlockExplorer

export class ProtocolBlockExplorerAdapter extends ProtocolBlockExplorerV0 {
  constructor(private readonly blockExplorerV1: AirGapBlockExplorer, url: string) {
    super(url)
  }

  public async getAddressLink(address: string): Promise<string> {
    return this.blockExplorerV1.createAddressUrl(address)
  }

  public async getTransactionLink(transactionId: string): Promise<string> {
    return this.blockExplorerV1.createTransactionUrl(transactionId)
  }

  public toJSON(): any {
    return {
      blockExplorer: this.blockExplorer
    }
  }
}

// ProtocolNetwork

export class ProtocolNetworkAdapter extends ProtocolNetworkV0 {
  constructor(
    name: string,
    type: ProtocolNetworkType | NetworkTypeV0,
    rpcUrl: string,
    blockExplorer: ProtocolBlockExplorerV0 | undefined,
    extras: unknown = {}
  ) {
    const networkType: NetworkTypeV0 = Object.values(NetworkTypeV0).includes(type as NetworkTypeV0)
      ? (type as NetworkTypeV0)
      : convertNetworkTypeV1ToV0(type as ProtocolNetworkType)

    super(name, networkType, rpcUrl, blockExplorer, extras)
  }
}

// ProtocolOptions

export class ProtocolOptionsAdapter implements ProtocolOptionsV0 {
  constructor(public readonly network: ProtocolNetworkV0, public readonly config: unknown = {}) {}
}

// TransactionValidator

export class TransactionValidatorAdapter implements TransactionValidator {
  constructor(private readonly protocolIdentifier: string, private readonly serializerCompanion: AirGapV3SerializerCompanion) {}

  public async validateUnsignedTransaction(transaction: TransactionSignRequest): Promise<any> {
    return this.serializerCompanion.validateTransactionSignRequest(this.protocolIdentifier, transaction)
  }

  public async validateSignedTransaction(transaction: TransactionSignResponse): Promise<any> {
    return this.serializerCompanion.validateTransactionSignResponse(this.protocolIdentifier, transaction)
  }
}

// ICoinProtocol

export class ICoinProtocolAdapter<T extends AirGapAnyProtocol = AirGapAnyProtocol> implements ICoinProtocol {
  public readonly symbol: string
  public readonly name: string
  public readonly marketSymbol: string
  public readonly assetSymbol: string | undefined
  public readonly feeSymbol: string
  public readonly feeDefaults: FeeDefaultsV0
  public readonly decimals: number
  public readonly feeDecimals: number
  public readonly identifier: ProtocolSymbols
  public readonly units: { unitSymbol: string; factor: string }[]
  public readonly supportsHD: boolean
  public readonly standardDerivationPath: string
  public readonly addressIsCaseSensitive: boolean
  public readonly addressValidationPattern: string
  public readonly addressPlaceholder: string
  public readonly options: ProtocolOptionsV0
  public readonly cryptoClient: CryptoClient

  private readonly networkV0: ProtocolNetworkV0
  private readonly blockExplorerV0: ProtocolBlockExplorerAdapter | undefined

  constructor(
    public readonly protocolV1: T,
    private readonly protocolMetadata: ProtocolMetadata,
    private readonly crypto: CryptoConfiguration | undefined,
    private readonly network: ProtocolNetwork | undefined,
    blockExplorerV1: AirGapBlockExplorer | undefined,
    blockExplorerMetadata: BlockExplorerMetadata | undefined,
    private readonly v3SerializerCompanion: AirGapV3SerializerCompanion
  ) {
    const units: ProtocolUnitsMetadata = this.protocolMetadata.units
    const mainUnit: string = this.protocolMetadata.mainUnit
    const symbol: ProtocolSymbol = units[mainUnit].symbol

    const feeUnits: ProtocolUnitsMetadata = protocolMetadata.fee?.units ?? protocolMetadata.units
    const mainFeeUnit: string = protocolMetadata.fee?.mainUnit ?? protocolMetadata.mainUnit
    const feeSymbol: ProtocolSymbol = feeUnits[mainFeeUnit].symbol

    const feeDefaults: FeeDefaults = protocolMetadata.fee?.defaults ?? {
      low: newAmount('0', 'blockchain'),
      medium: newAmount('0', 'blockchain'),
      high: newAmount('0', 'blockchain')
    }

    const maxDecimals: number = Math.max(...Object.values(protocolMetadata.units).map((unit) => unit.decimals))

    this.name = this.protocolMetadata.name
    this.identifier = this.protocolMetadata.identifier as ProtocolSymbols

    this.symbol = symbol.value
    this.marketSymbol = symbol.market ?? symbol.value
    this.assetSymbol = symbol.asset
    this.decimals = units[mainUnit].decimals

    this.feeSymbol = feeSymbol.value
    this.feeDefaults = this.convertFeeDefaultsV1ToV0(feeDefaults)
    this.feeDecimals = feeUnits[mainFeeUnit].decimals

    this.units = Object.entries(protocolMetadata.units).map((entry) => {
      const unitSymbol: string = entry[0]
      const factor: string = new BigNumber(1).shiftedBy(-(maxDecimals - entry[1].decimals)).toFixed()

      return { unitSymbol, factor }
    })

    this.supportsHD = isBip32Protocol(this.protocolV1)

    this.standardDerivationPath = this.protocolMetadata.account?.standardDerivationPath ?? 'm/'
    this.addressIsCaseSensitive = this.protocolMetadata.account.address?.isCaseSensitive ?? false
    this.addressValidationPattern = this.protocolMetadata.account?.address?.regex ?? '*+'
    this.addressPlaceholder = this.protocolMetadata.account?.address?.placeholder ?? ''

    let knownOptions: ProtocolOptionsV0 | undefined
    try {
      knownOptions = getProtocolOptionsByIdentifierLegacy(this.protocolMetadata.identifier as ProtocolSymbols)
      // eslint-disable-next-line no-empty
    } catch {}

    this.blockExplorerV0 =
      blockExplorerV1 && blockExplorerMetadata ? new ProtocolBlockExplorerAdapter(blockExplorerV1, blockExplorerMetadata.url) : undefined
    this.networkV0 = this.getNetwork(knownOptions)
    this.options = new ProtocolOptionsAdapter(this.networkV0, knownOptions?.config ?? {})
  }

  public async getSymbol(): Promise<string> {
    return this.symbol
  }

  public async getName(): Promise<string> {
    return this.name
  }

  public async getMarketSymbol(): Promise<string> {
    return this.marketSymbol
  }

  public async getAssetSymbol(): Promise<string | undefined> {
    return this.assetSymbol
  }

  public async getFeeSymbol(): Promise<string> {
    return this.feeSymbol
  }

  public async getFeeDefaults(): Promise<FeeDefaultsV0> {
    return this.feeDefaults
  }

  public async getDecimals(): Promise<number> {
    return this.decimals
  }

  public async getFeeDecimals(): Promise<number> {
    return this.feeDecimals
  }

  public async getIdentifier(): Promise<ProtocolSymbols> {
    return this.identifier
  }

  public async getUnits(): Promise<{ unitSymbol: string; factor: string }[]> {
    return this.units
  }

  public async getSupportsHD(): Promise<boolean> {
    return this.supportsHD
  }

  public async getStandardDerivationPath(): Promise<string> {
    return this.standardDerivationPath
  }

  public async getAddressIsCaseSensitive(): Promise<boolean> {
    return this.addressIsCaseSensitive
  }

  public async getAddressValidationPattern(): Promise<string> {
    return this.addressValidationPattern
  }

  public async getAddressPlaceholder(): Promise<string> {
    return this.addressPlaceholder
  }

  public async getOptions(): Promise<ProtocolOptionsV0> {
    return this.options
  }

  public async getBlockExplorerLinkForAddress(address: string): Promise<string> {
    if (this.blockExplorerV0 === undefined) {
      throw new Error('Method not supported, BlockExplorer not found.')
    }

    return this.blockExplorerV0.getAddressLink(address)
  }

  public async getBlockExplorerLinkForTxId(txId: string): Promise<string> {
    if (this.blockExplorerV0 === undefined) {
      throw new Error('Method not supported, BlockExplorer not found.')
    }

    return this.blockExplorerV0.getTransactionLink(txId)
  }

  public async getTransactionsFromPublicKey(
    publicKey: string,
    limit: number,
    cursor?: IProtocolTransactionCursor
  ): Promise<IAirGapTransactionResult> {
    if (!isOnlineProtocol(this.protocolV1)) {
      throw new Error('Method not supported, required interface: Online.')
    }

    const transactions: AirGapTransactionsWithCursor = await this.protocolV1.getTransactionsForPublicKey(
      newPublicKey(publicKey, getBytesFormatV1FromV0(publicKey)),
      limit,
      cursor as TransactionCursor
    )

    return {
      transactions: await this.convertTransactionDetailsV1ToV0(transactions.transactions),
      cursor
    }
  }

  public async getTransactionsFromExtendedPublicKey(
    extendedPublicKey: string,
    limit: number,
    cursor?: IProtocolTransactionCursor
  ): Promise<IAirGapTransactionResult> {
    if (!isOnlineProtocol(this.protocolV1) || !isBip32Protocol(this.protocolV1)) {
      throw new Error('Method not supported, required interface: Online, Bip32.')
    }

    const transactions: AirGapTransactionsWithCursor = await this.protocolV1.getTransactionsForPublicKey(
      newExtendedPublicKey(extendedPublicKey, getBytesFormatV1FromV0(extendedPublicKey)),
      limit,
      cursor as TransactionCursor
    )

    return {
      transactions: await this.convertTransactionDetailsV1ToV0(transactions.transactions),
      cursor
    }
  }

  public async getTransactionsFromAddresses(
    addresses: string[],
    limit: number,
    cursor?: IProtocolTransactionCursor
  ): Promise<IAirGapTransactionResult> {
    if (!isOnlineProtocol(this.protocolV1)) {
      throw new Error('Method not supported, required interface: Online, FetchDataForAddress/FetchDataForMultipleAddresses.')
    }

    let transactions: AirGapTransactionsWithCursor
    if (addresses.length === 1 && canFetchDataForAddress(this.protocolV1)) {
      transactions = await this.protocolV1.getTransactionsForAddress(addresses[0], limit, cursor as TransactionCursor)
    } else if (canFetchDataForMultipleAddresses(this.protocolV1)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      transactions = await this.protocolV1.getTransactionsForAddresses(addresses, limit, cursor as TransactionCursor)
    } else {
      throw new Error('Method not supported, required interface: Online, FetchDataForAddress/FetchDataForMultipleAddresses.')
    }

    return {
      transactions: await this.convertTransactionDetailsV1ToV0(transactions.transactions),
      cursor: transactions.cursor ? transactions.cursor : cursor
    }
  }

  public async getBalanceOfAddresses(addresses: string[], _data?: { [key: string]: unknown }): Promise<string> {
    if (!isOnlineProtocol(this.protocolV1)) {
      throw new Error('Method not supported, required interface: Online, FetchDataForAddress/FetchDataForMultipleAddresses.')
    }

    let balance: Balance
    if (addresses.length === 1 && canFetchDataForAddress(this.protocolV1)) {
      balance = await this.protocolV1.getBalanceOfAddress(addresses[0])
    } else if (canFetchDataForMultipleAddresses(this.protocolV1)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      balance = await this.protocolV1.getBalanceOfAddresses(addresses)
    } else {
      throw new Error('Method not supported, required interface: Online, FetchDataForAddress/FetchDataForMultipleAddresses.')
    }

    return newAmount(balance.total).blockchain(this.protocolMetadata.units).value
  }

  public async getBalanceOfPublicKey(
    publicKey: string,
    data?: { [key: string]: unknown; addressIndex?: number; assetID?: string }
  ): Promise<string> {
    if (!isOnlineProtocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Online.')
    }

    const publicKeyV1: PublicKey = newPublicKey(publicKey, getBytesFormatV1FromV0(publicKey))

    const balance: Balance =
      data?.assetID && isMultiTokenSubProtocol(this.protocolV1)
        ? await this.protocolV1.getBalanceOfPublicKey(publicKeyV1, { tokenId: data.assetID })
        : await this.protocolV1.getBalanceOfPublicKey(publicKeyV1)

    return newAmount(balance.total).blockchain(this.protocolMetadata.units).value
  }

  public async getBalanceOfExtendedPublicKey(
    extendedPublicKey: string,
    _offset: number,
    data?: { [key: string]: unknown; assetID?: string }
  ): Promise<string> {
    if (!isOnlineProtocol(this.protocolV1) || !isBip32Protocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Online, Bip32.')
    }

    const extendedPublicKeyV1: ExtendedPublicKey = newExtendedPublicKey(extendedPublicKey, getBytesFormatV1FromV0(extendedPublicKey))

    const balance: Balance =
      data?.assetID && isMultiTokenSubProtocol(this.protocolV1)
        ? await this.protocolV1.getBalanceOfPublicKey(extendedPublicKeyV1, { tokenId: data.assetID })
        : await this.protocolV1.getBalanceOfPublicKey(extendedPublicKeyV1)

    return newAmount(balance.total).blockchain(this.protocolMetadata.units).value
  }

  public async getAvailableBalanceOfAddresses(addresses: string[], _data?: { [key: string]: unknown }): Promise<string> {
    if (!isOnlineProtocol(this.protocolV1)) {
      throw new Error('Method not supported, required interface: Online, FetchDataForAddress/FetchDataForMultipleAddresses.')
    }

    let balance: Balance
    if (addresses.length === 1 && canFetchDataForAddress(this.protocolV1)) {
      balance = await this.protocolV1.getBalanceOfAddress(addresses[0])
    } else if (canFetchDataForMultipleAddresses(this.protocolV1)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      balance = await this.protocolV1.getBalanceOfAddresses(addresses)
    } else {
      throw new Error('Method not supported, required interface: Online, FetchDataForAddress/FetchDataForMultipleAddresses.')
    }

    return newAmount(balance.transferable ?? balance.total).blockchain(this.protocolMetadata.units).value
  }

  public async getTransactionStatuses(transactionHash: string[]): Promise<AirGapTransactionStatusV0[]> {
    if (!isOnlineProtocol(this.protocolV1) || !isTransactionStatusChecker(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Online, TransactionStatusChecker.')
    }

    const statuses: Record<string, AirGapTransactionStatus> = await this.protocolV1.getTransactionStatus(transactionHash)

    return transactionHash.map((hash: string) => {
      const status: AirGapTransactionStatus = statuses[hash]

      return convertTransactionStatusV1ToV0(status)
    })
  }

  public async getBalanceOfPublicKeyForSubProtocols(_publicKey: string, _subProtocols: ICoinSubProtocol[]): Promise<string[]> {
    throw new Error('Method not supported.')
  }

  public async estimateMaxTransactionValueFromExtendedPublicKey(
    extendedPublicKey: string,
    recipients: string[],
    fee?: string,
    _data?: { [key: string]: unknown }
  ): Promise<string> {
    if (!isOnlineProtocol(this.protocolV1) || !isBip32Protocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Online, Bip32.')
    }

    const maxAmount: Amount = await this.protocolV1.getTransactionMaxAmountWithPublicKey(
      newExtendedPublicKey(extendedPublicKey, getBytesFormatV1FromV0(extendedPublicKey)),
      recipients,
      {
        fee: fee ? newAmount(fee, 'blockchain') : undefined
      }
    )

    return newAmount(maxAmount).blockchain(this.protocolMetadata.units).value
  }

  public async estimateMaxTransactionValueFromPublicKey(
    publicKey: string,
    recipients: string[],
    fee?: string,
    _data?: { [key: string]: unknown; addressIndex?: number }
  ): Promise<string> {
    if (!isOnlineProtocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Online.')
    }

    const maxAmount: Amount = await this.protocolV1.getTransactionMaxAmountWithPublicKey(
      newPublicKey(publicKey, getBytesFormatV1FromV0(publicKey)),
      recipients,
      {
        fee: fee ? newAmount(fee, 'blockchain') : undefined
      }
    )

    return newAmount(maxAmount).blockchain(this.protocolMetadata.units).value
  }

  public async estimateFeeDefaultsFromExtendedPublicKey(
    publicKey: string,
    recipients: string[],
    values: string[],
    data?: { [key: string]: unknown; assetID?: string }
  ): Promise<FeeDefaultsV0> {
    if (!isOnlineProtocol(this.protocolV1) || !isBip32Protocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Online, Bip32.')
    }

    const feeEstimation: FeeEstimation | undefined = await this.protocolV1.getTransactionFeeWithPublicKey(
      newExtendedPublicKey(publicKey, getBytesFormatV1FromV0(publicKey)),
      this.combineTransactionDetails(recipients, values),
      { assetId: data?.assetID ? parseInt(data.assetID, 10) : undefined }
    )

    if (feeEstimation === undefined) {
      throw new Error('Method `estimateFeeDefaultsFromExtendedPublicKey` not supported.')
    }

    const feeDefaults: FeeDefaults = isAmount(feeEstimation)
      ? { low: feeEstimation, medium: feeEstimation, high: feeEstimation }
      : feeEstimation

    return this.convertFeeDefaultsV1ToV0(feeDefaults)
  }

  public async estimateFeeDefaultsFromPublicKey(
    publicKey: string,
    recipients: string[],
    values: string[],
    data?: { [key: string]: unknown; assetID?: string }
  ): Promise<FeeDefaultsV0> {
    if (!isOnlineProtocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Online.')
    }

    if (recipients.length !== values.length) {
      throw new Error('Recipients length must match values length.')
    }

    const transactionDetails: TransactionDetails[] = recipients.map((recipient: string, index: number) => ({
      to: recipient,
      amount: newAmount(values[index], 'blockchain')
    }))

    const feeEstimation: FeeEstimation | undefined = await this.protocolV1.getTransactionFeeWithPublicKey(
      newPublicKey(publicKey, getBytesFormatV1FromV0(publicKey)),
      transactionDetails,
      { assetId: data?.assetID ? parseInt(data.assetID, 10) : undefined }
    )

    if (feeEstimation === undefined) {
      throw new Error('Method `estimateFeeDefaultsFromPublicKey` not supported.')
    }

    const feeDefaults: FeeDefaults = isAmount(feeEstimation)
      ? { low: feeEstimation, medium: feeEstimation, high: feeEstimation }
      : feeEstimation

    return this.convertFeeDefaultsV1ToV0(feeDefaults)
  }

  public async prepareTransactionFromExtendedPublicKey(
    extendedPublicKey: string,
    _offset: number,
    recipients: string[],
    values: string[],
    fee: string,
    extras?: { [key: string]: unknown; assetID?: string }
  ): Promise<any> {
    if (!isOnlineProtocol(this.protocolV1) || !isBip32Protocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Online.')
    }

    const transaction: UnsignedTransaction = await this.protocolV1.prepareTransactionWithPublicKey(
      newExtendedPublicKey(extendedPublicKey, getBytesFormatV1FromV0(extendedPublicKey)),
      this.combineTransactionDetails(recipients, values),
      {
        fee: newAmount(fee, 'blockchain'),
        assetId: extras?.assetID ? parseInt(extras.assetID, 10) : undefined
      }
    )

    const transactionV0 = await this.convertUnsignedTransactionV1ToV0(transaction, extendedPublicKey)

    return transactionV0.transaction
  }

  public async prepareTransactionFromPublicKey(
    publicKey: string,
    recipients: string[],
    values: string[],
    fee: string,
    extras?: { [key: string]: unknown; assetID?: string }
  ): Promise<any> {
    if (!isOnlineProtocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Online.')
    }

    const transaction: UnsignedTransaction = await this.protocolV1.prepareTransactionWithPublicKey(
      newPublicKey(publicKey, getBytesFormatV1FromV0(publicKey)),
      this.combineTransactionDetails(recipients, values),
      {
        fee: newAmount(fee, 'blockchain'),
        assetId: extras?.assetID ? parseInt(extras.assetID, 10) : undefined
      }
    )

    const transactionV0 = await this.convertUnsignedTransactionV1ToV0(transaction, publicKey)

    return transactionV0.transaction
  }

  public async broadcastTransaction(rawTransaction: any): Promise<string> {
    if (!isOnlineProtocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Online.')
    }

    const transaction = { transaction: rawTransaction, accountIdentifier: '' }
    const signed: SignedTransaction = await this.convertSignedTransactionV0ToV1(transaction)

    return this.protocolV1.broadcastTransaction(signed)
  }

  public async getAddressFromPublicKey(publicKey: string, _cursor?: IProtocolAddressCursor): Promise<IAirGapAddressResult> {
    const address: AddressWithCursor | string = await this.protocolV1.getAddressFromPublicKey(
      newPublicKey(publicKey, getBytesFormatV1FromV0(publicKey))
    )

    return {
      address: typeof address === 'string' ? address : address.address,
      cursor: typeof address === 'object' ? address.cursor : { hasNext: false }
    }
  }

  public async getAddressesFromPublicKey(publicKey: string, _cursor?: IProtocolAddressCursor): Promise<IAirGapAddressResult[]> {
    if (hasMultiAddressPublicKeys(this.protocolV1)) {
      const pk: PublicKey = newPublicKey(publicKey, getBytesFormatV1FromV0(publicKey))
      const addresses: AddressWithCursor[] = await this.protocolV1.getInitialAddressesFromPublicKey(pk)

      return addresses
    } else {
      return [await this.getAddressFromPublicKey(publicKey)]
    }
  }

  public async getAddressFromExtendedPublicKey(
    extendedPublicKey: string,
    visibilityDerivationIndex: number,
    addressDerivationIndex: number
  ): Promise<IAirGapAddressResult> {
    if (!isBip32Protocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Bip32.')
    }

    const derivedPublicKey: PublicKey = await this.protocolV1.deriveFromExtendedPublicKey(
      newExtendedPublicKey(extendedPublicKey, getBytesFormatV1FromV0(extendedPublicKey)),
      visibilityDerivationIndex,
      addressDerivationIndex
    )

    return this.getAddressFromPublicKey(derivedPublicKey.value)
  }

  public async getAddressesFromExtendedPublicKey(
    extendedPublicKey: string,
    visibilityDerivationIndex: number,
    addressCount: number,
    offset: number
  ): Promise<IAirGapAddressResult[]> {
    if (!isBip32Protocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Bip32.')
    }

    const generatorArray = Array.from(new Array(addressCount), (_, i) => i + offset)

    return Promise.all(
      generatorArray.map((addressDerivationIndex: number) =>
        this.getAddressFromExtendedPublicKey(extendedPublicKey, visibilityDerivationIndex, addressDerivationIndex)
      )
    )
  }

  public async getTransactionDetails(
    transaction: UnsignedTransactionV0,
    data?: { [key: string]: unknown; knownViewingKeys?: string[]; transactionOwner?: string }
  ): Promise<IAirGapTransaction[]> {
    const unsigned: UnsignedTransaction = await this.convertUnsignedTransactionV0ToV1(transaction, data?.transactionOwner)

    let transactions: AirGapTransaction[]
    if (this.isExtendedPublicKey(transaction.publicKey)) {
      if (!isBip32Protocol(this.protocolV1)) {
        throw new Error('Method not supported, required inferface: Bip32.')
      }

      transactions = await this.protocolV1.getDetailsFromTransaction(
        unsigned,
        newExtendedPublicKey(transaction.publicKey, getBytesFormatV1FromV0(transaction.publicKey))
      )
    } else {
      const publicKey: PublicKey = newPublicKey(transaction.publicKey, getBytesFormatV1FromV0(transaction.publicKey))
      transactions =
        data?.knownViewingKeys && isTezosSaplingProtocol(this.protocolV1)
          ? await this.protocolV1.getDetailsFromTransaction(unsigned as any, publicKey, data.knownViewingKeys)
          : await this.protocolV1.getDetailsFromTransaction(unsigned, publicKey)
    }

    const transactionsV0: IAirGapTransaction[] = await this.convertTransactionDetailsV1ToV0(transactions)

    return transactionsV0.map(
      (tx: IAirGapTransaction): IAirGapTransaction => ({
        ...tx,
        transactionDetails: tx.transactionDetails ?? transaction.transaction
      })
    )
  }

  public async getTransactionDetailsFromSigned(
    transaction: SignedTransactionV0,
    data?: { [key: string]: unknown; knownViewingKeys?: string[]; transactionOwner?: string }
  ): Promise<IAirGapTransaction[]> {
    const signed: SignedTransaction = await this.convertSignedTransactionV0ToV1(transaction, data?.transactionOwner)

    let transactions: AirGapTransaction[]
    if (this.isExtendedPublicKey(transaction.accountIdentifier)) {
      if (!isBip32Protocol(this.protocolV1)) {
        throw new Error('Method not supported, required inferface: Bip32.')
      }

      transactions = await this.protocolV1.getDetailsFromTransaction(
        signed,
        newExtendedPublicKey(transaction.accountIdentifier, getBytesFormatV1FromV0(transaction.accountIdentifier))
      )
    } else {
      const publicKey: PublicKey = newPublicKey(transaction.accountIdentifier, getBytesFormatV1FromV0(transaction.accountIdentifier))
      transactions =
        data?.knownViewingKeys && isTezosSaplingProtocol(this.protocolV1)
          ? await this.protocolV1.getDetailsFromTransaction(signed as any, publicKey, data.knownViewingKeys)
          : await this.protocolV1.getDetailsFromTransaction(signed, publicKey)
    }

    const transactionsV0: IAirGapTransaction[] = await this.convertTransactionDetailsV1ToV0(transactions)

    return transactionsV0.map(
      (tx: IAirGapTransaction): IAirGapTransaction => ({
        ...tx,
        transactionDetails: tx.transactionDetails ?? transaction.transaction
      })
    )
  }

  public async verifyMessage(message: string, signature: string, publicKey: string): Promise<boolean> {
    if (!isOfflineProtocol(this.protocolV1) || !canSignMessage(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Offline, SignMessage.')
    }

    return this.protocolV1.verifyMessageWithPublicKey(
      message,
      newSignature(signature, getBytesFormatV1FromV0(signature)),
      newPublicKey(publicKey, getBytesFormatV1FromV0(publicKey))
    )
  }

  public async encryptAsymmetric(payload: string, publicKey: string): Promise<string> {
    if (!isOfflineProtocol(this.protocolV1) || !canEncryptAsymmetric(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Offline, AsymmetricEncryption.')
    }

    return this.protocolV1.encryptAsymmetricWithPublicKey(payload, newPublicKey(publicKey, getBytesFormatV1FromV0(publicKey)))
  }

  public async getPublicKeyFromMnemonic(mnemonic: string, derivationPath: string, password?: string): Promise<string> {
    if (!isOfflineProtocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Offline.')
    }

    const crypto: CryptoConfiguration = this.crypto ?? (await this.protocolV1.getCryptoConfiguration())
    const seed: Buffer = await mnemonicToSeed(crypto, mnemonic, password)

    return this.getPublicKeyFromHexSecret(seed.toString('hex'), derivationPath)
  }

  public async getPrivateKeyFromMnemonic(mnemonic: string, derivationPath: string, password?: string): Promise<string> {
    if (!isOfflineProtocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Offline.')
    }

    const crypto: CryptoConfiguration = this.crypto ?? (await this.protocolV1.getCryptoConfiguration())
    const seed: Buffer = await mnemonicToSeed(crypto, mnemonic, password)

    return this.getPrivateKeyFromHexSecret(seed.toString('hex'), derivationPath)
  }

  public async getExtendedPublicKeyFromMnemonic(mnemonic: string, derivationPath: string, password?: string): Promise<string> {
    if (!isOfflineProtocol(this.protocolV1) || !isBip32Protocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Offline, Bip32.')
    }

    const crypto: CryptoConfiguration = this.crypto ?? (await this.protocolV1.getCryptoConfiguration())
    const seed: Buffer = await mnemonicToSeed(crypto, mnemonic, password)

    return this.getExtendedPublicKeyFromHexSecret(seed.toString('hex'), derivationPath)
  }

  public async getExtendedPrivateKeyFromMnemonic(mnemonic: string, derivationPath: string, password?: string): Promise<string> {
    if (!isOfflineProtocol(this.protocolV1) || !isBip32Protocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Offline, Bip32.')
    }

    const crypto: CryptoConfiguration = this.crypto ?? (await this.protocolV1.getCryptoConfiguration())
    const seed: Buffer = await mnemonicToSeed(crypto, mnemonic, password)

    return this.getExtendedPrivateKeyFromHexSecret(seed.toString('hex'), derivationPath)
  }

  public async getPublicKeyFromHexSecret(secret: string, derivationPath: string): Promise<string> {
    if (!isOfflineProtocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Offline, Bip32.')
    }

    const crypto: CryptoConfiguration = this.crypto ?? (await this.protocolV1.getCryptoConfiguration())
    const derivative: CryptoDerivative = await derive(crypto, Buffer.from(secret, 'hex'), derivationPath)
    const keyPair: KeyPair = await this.protocolV1.getKeyPairFromDerivative(derivative)

    return keyPair.publicKey.value
  }

  public async getPrivateKeyFromHexSecret(secret: string, derivationPath: string): Promise<string> {
    if (!isOfflineProtocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Offline.')
    }

    const crypto: CryptoConfiguration = this.crypto ?? (await this.protocolV1.getCryptoConfiguration())
    const derivative: CryptoDerivative = await derive(crypto, Buffer.from(secret, 'hex'), derivationPath)
    const keyPair: KeyPair = await this.protocolV1.getKeyPairFromDerivative(derivative)

    return keyPair.secretKey.value
  }

  public async getExtendedPublicKeyFromHexSecret(secret: string, derivationPath: string): Promise<string> {
    if (!isOfflineProtocol(this.protocolV1) || !isBip32Protocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Offline, Bip32.')
    }

    const crypto: CryptoConfiguration = this.crypto ?? (await this.protocolV1.getCryptoConfiguration())
    const derivative: CryptoDerivative = await derive(crypto, Buffer.from(secret, 'hex'), derivationPath)
    const keyPair: ExtendedKeyPair = await this.protocolV1.getExtendedKeyPairFromDerivative(derivative)

    return keyPair.publicKey.value
  }

  public async getExtendedPrivateKeyFromHexSecret(secret: string, derivationPath: string): Promise<string> {
    if (!isOfflineProtocol(this.protocolV1) || !isBip32Protocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Offline, Bip32.')
    }

    const crypto: CryptoConfiguration = this.crypto ?? (await this.protocolV1.getCryptoConfiguration())
    const derivative: CryptoDerivative = await derive(crypto, Buffer.from(secret, 'hex'), derivationPath)
    const keyPair: ExtendedKeyPair = await this.protocolV1.getExtendedKeyPairFromDerivative(derivative)

    return keyPair.secretKey.value
  }

  public async signWithExtendedPrivateKey(extendedPrivateKey: string, transaction: any, childDerivationPath?: string): Promise<string> {
    if (!isOfflineProtocol(this.protocolV1) || !isBip32Protocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Offline, Bip32.')
    }

    const unsigned: UnsignedTransaction = await this.convertUnsignedTransactionV0ToV1({
      transaction,
      publicKey: ''
    })

    const extendedSecretKey: ExtendedSecretKey = newExtendedSecretKey(extendedPrivateKey, getBytesFormatV1FromV0(extendedPrivateKey))

    const secretKey: ExtendedSecretKey | SecretKey = childDerivationPath
      ? await this.deriveSecretKey(extendedSecretKey, childDerivationPath)
      : extendedSecretKey

    const signed: SignedTransaction = await this.protocolV1.signTransactionWithSecretKey(unsigned, secretKey)
    const signedV0: TransactionSignResponse = await this.convertSignedTransactionV1ToV0(signed, '')

    return signedV0.transaction
  }

  public async signWithPrivateKey(privateKey: string, transaction: any): Promise<string> {
    if (!isOfflineProtocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Offline.')
    }

    const unsigned: UnsignedTransaction = await this.convertUnsignedTransactionV0ToV1({
      transaction,
      publicKey: ''
    })

    const signed: SignedTransaction = await this.protocolV1.signTransactionWithSecretKey(
      unsigned,
      newSecretKey(privateKey, getBytesFormatV1FromV0(privateKey))
    )
    const signedV0: TransactionSignResponse = await this.convertSignedTransactionV1ToV0(signed, '')

    return signedV0.transaction
  }

  public async signMessage(message: string, keypair: { publicKey?: string; privateKey: string }): Promise<string> {
    if (!isOfflineProtocol(this.protocolV1) || !canSignMessage(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Offline, SignMessage.')
    }

    const privateKey =
      getSecretKeyType(keypair.privateKey) === 'xpriv'
        ? await this.getPrivateKeyFromExtendedPrivateKey(keypair.privateKey)
        : keypair.privateKey

    const publicKey = keypair.publicKey
      ? getPublicKeyType(keypair.publicKey) === 'xpub'
        ? await this.getPublicKeyFromExtendedPrivateKey(keypair.publicKey)
        : keypair.publicKey
      : ''

    const signature: Signature = await this.protocolV1.signMessageWithKeyPair(message, {
      secretKey: newSecretKey(privateKey, getBytesFormatV1FromV0(privateKey)),
      publicKey: newPublicKey(publicKey, getBytesFormatV1FromV0(publicKey))
    })

    return signature.value
  }

  public async decryptAsymmetric(encryptedPayload: string, keypair: { publicKey?: string; privateKey: string }): Promise<string> {
    if (!isOfflineProtocol(this.protocolV1) || !canEncryptAsymmetric(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Offline, AsymmetricEncryption.')
    }

    const privateKey =
      getSecretKeyType(keypair.privateKey) === 'xpriv'
        ? await this.getPrivateKeyFromExtendedPrivateKey(keypair.privateKey)
        : keypair.privateKey

    const publicKey = keypair.publicKey
      ? getPublicKeyType(keypair.publicKey) === 'xpub'
        ? await this.getPublicKeyFromExtendedPrivateKey(keypair.publicKey)
        : keypair.publicKey
      : ''

    return this.protocolV1.decryptAsymmetricWithKeyPair(encryptedPayload, {
      secretKey: newSecretKey(privateKey, getBytesFormatV1FromV0(privateKey)),
      publicKey: newPublicKey(publicKey, getBytesFormatV1FromV0(publicKey))
    })
  }

  public async encryptAES(payload: string, privateKey: string): Promise<string> {
    if (!isOfflineProtocol(this.protocolV1) || !canEncryptAES(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Offline, AES.')
    }

    // eslint-disable-next-line no-param-reassign
    privateKey = getSecretKeyType(privateKey) === 'xpriv' ? await this.getPrivateKeyFromExtendedPrivateKey(privateKey) : privateKey

    return this.protocolV1.encryptAESWithSecretKey(payload, newSecretKey(privateKey, getBytesFormatV1FromV0(privateKey)))
  }

  public async decryptAES(encryptedPayload: string, privateKey: string): Promise<string> {
    if (!isOfflineProtocol(this.protocolV1) || !canEncryptAES(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Offline, AES.')
    }

    // eslint-disable-next-line no-param-reassign
    privateKey = getSecretKeyType(privateKey) === 'xpriv' ? await this.getPrivateKeyFromExtendedPrivateKey(privateKey) : privateKey

    return this.protocolV1.decryptAESWithSecretKey(encryptedPayload, newSecretKey(privateKey, getBytesFormatV1FromV0(privateKey)))
  }

  public async getPrivateKeyFromExtendedPrivateKey(extendedPrivateKey: string, childDerivationPath?: string): Promise<string> {
    if (!isOfflineProtocol(this.protocolV1) || !isBip32Protocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Offline, Bip32.')
    }

    const secretKey: SecretKey = await this.deriveSecretKey(
      newExtendedSecretKey(extendedPrivateKey, getBytesFormatV1FromV0(extendedPrivateKey)),
      childDerivationPath
    )

    return secretKey.value
  }

  public async getPublicKeyFromExtendedPrivateKey(extendedPublicKey: string, childDerivationPath?: string): Promise<string> {
    if (!isBip32Protocol(this.protocolV1)) {
      throw new Error('Method not supported, required inferface: Bip32.')
    }

    const publicKey: PublicKey = await this.derivePublicKey(
      newExtendedPublicKey(extendedPublicKey, getBytesFormatV1FromV0(extendedPublicKey)),
      childDerivationPath
    )

    return publicKey.value
  }

  protected getNetwork(protocolOptions?: ProtocolOptionsV0): ProtocolNetworkV0 {
    let knownOptions: ProtocolOptionsV0 | undefined
    try {
      knownOptions = protocolOptions ?? getProtocolOptionsByIdentifierLegacy(this.identifier)
      // eslint-disable-next-line no-empty
    } catch {}

    const { name, type, rpcUrl, ...rest } = this.network ?? {}

    return new ProtocolNetworkAdapter(
      name ?? knownOptions?.network.name ?? '',
      type ?? knownOptions?.network.type ?? 'mainnet',
      rpcUrl ?? knownOptions?.network.rpcUrl ?? '',
      this.blockExplorerV0,
      rest || (knownOptions?.network.extras ?? {})
    )
  }

  protected async deriveSecretKey(extendedSecretKey: ExtendedSecretKey, childDerivationPath: string = '0/0'): Promise<SecretKey> {
    if (!isOfflineProtocol(this.protocolV1) || !isBip32Protocol(this.protocolV1)) {
      throw new Error(`Protocol doesn't support secret key derivation, missing inferface: Offline, Bip32.`)
    }

    if (childDerivationPath.startsWith('m')) {
      throw new Error('Received full derivation path, expected child derivation path')
    }

    if (childDerivationPath.toLowerCase().includes('h') || childDerivationPath.includes(`'`)) {
      throw new Error('Child derivation path cannot include hardened children')
    }

    const [visibilityIndex, addressIndex]: number[] = childDerivationPath.split('/').map((index: string) => parseInt(index, 10))

    return this.protocolV1.deriveFromExtendedSecretKey(extendedSecretKey, visibilityIndex, addressIndex)
  }

  protected async derivePublicKey(extendedPublicKey: ExtendedPublicKey, childDerivationPath: string = '0/0'): Promise<PublicKey> {
    if (!isBip32Protocol(this.protocolV1)) {
      throw new Error(`Protocol doesn't support public key derivation, missing inferface: Bip32.`)
    }

    if (childDerivationPath.startsWith('m')) {
      throw new Error('Received full derivation path, expected child derivation path')
    }

    if (childDerivationPath.toLowerCase().includes('h') || childDerivationPath.includes(`'`)) {
      throw new Error('Child derivation path cannot include hardened children')
    }

    const [visibilityIndex, addressIndex]: number[] = childDerivationPath.split('/').map((index: string) => parseInt(index, 10))

    return this.protocolV1.deriveFromExtendedPublicKey(extendedPublicKey, visibilityIndex, addressIndex)
  }

  protected async getSerializerIdentifier(base?: string): Promise<string> {
    const identifier: string = base ?? (await this.getIdentifier())

    return identifier.startsWith(SubProtocolSymbols.ETH_ERC20)
      ? SubProtocolSymbols.ETH_ERC20
      : identifier.startsWith(SubProtocolSymbols.OPTIMISM_ERC20)
      ? SubProtocolSymbols.OPTIMISM_ERC20
      : identifier
  }

  public async convertUnsignedTransactionV0ToV1(transaction: TransactionSignRequest, owner?: string): Promise<UnsignedTransaction> {
    const identifier: string = await this.getSerializerIdentifier(owner)

    return this.v3SerializerCompanion.fromTransactionSignRequest(identifier, transaction)
  }

  public async convertUnsignedTransactionV1ToV0(
    transaction: UnsignedTransaction,
    publicKey: string,
    callbackUrl?: string,
    owner?: string
  ): Promise<TransactionSignRequest> {
    const identifier: string = await this.getSerializerIdentifier(owner)

    return this.v3SerializerCompanion.toTransactionSignRequest(identifier, transaction, publicKey, callbackUrl)
  }

  public async convertSignedTransactionV0ToV1(transaction: TransactionSignResponse, owner?: string): Promise<SignedTransaction> {
    const identifier: string = await this.getSerializerIdentifier(owner)

    return this.v3SerializerCompanion.fromTransactionSignResponse(identifier, transaction)
  }

  public async convertSignedTransactionV1ToV0(
    transaction: SignedTransaction,
    accountIdentifier: string,
    owner?: string
  ): Promise<TransactionSignResponse> {
    const identifier: string = await this.getSerializerIdentifier(owner)

    return this.v3SerializerCompanion.toTransactionSignResponse(identifier, transaction, accountIdentifier)
  }

  public convertFeeDefaultsV1ToV0(feeDefaults: FeeDefaults): FeeDefaultsV0 {
    return convertFeeDefaultsV1ToV0(feeDefaults, this.protocolMetadata)
  }

  public async convertTransactionDetailsV1ToV0(txs: AirGapTransaction[]): Promise<IAirGapTransaction[]> {
    return convertTransactionDetailsV1ToV0(txs, this.protocolMetadata, this.networkV0)
  }

  protected combineTransactionDetails(recipients: string[], values: string[]): TransactionDetails[] {
    if (recipients.length !== values.length) {
      throw new Error('Recipients length must match values length.')
    }

    return recipients.map((recipient: string, index: number) => ({
      to: recipient,
      amount: newAmount(values[index], 'blockchain')
    }))
  }

  protected isExtendedPublicKey(publicKey: string): boolean {
    return publicKey.startsWith('xpub') || publicKey.startsWith('ypub') || publicKey.startsWith('zpub')
  }
}

// ICoinDelegateProtocol

export class ICoinDelegateProtocolAdapter<T extends AirGapAnyProtocol & AirGapDelegateProtocol>
  extends ICoinProtocolAdapter<T>
  implements ICoinDelegateProtocol
{
  public async getDefaultDelegatee(): Promise<string> {
    return this.protocolV1.getDefaultDelegatee()
  }

  public async getCurrentDelegateesForPublicKey(publicKey: string, data?: any): Promise<string[]> {
    return this.protocolV1.getCurrentDelegateesForPublicKey(
      { type: 'pub', value: publicKey, format: getBytesFormatV1FromV0(publicKey) },
      data
    )
  }

  public async getCurrentDelegateesForAddress(address: string, data?: any): Promise<string[]> {
    return this.protocolV1.getCurrentDelegateesForAddress(address, data)
  }

  public async getDelegateeDetails(address: string, data?: any): Promise<DelegateeDetails> {
    return this.protocolV1.getDelegateeDetails(address, data)
  }

  public async isPublicKeyDelegating(publicKey: string, data?: any): Promise<boolean> {
    return this.protocolV1.isPublicKeyDelegating({ type: 'pub', value: publicKey, format: getBytesFormatV1FromV0(publicKey) }, data)
  }

  public async isAddressDelegating(address: string, data?: any): Promise<boolean> {
    return this.protocolV1.isAddressDelegating(address, data)
  }

  public async getDelegatorDetailsFromPublicKey(publicKey: string, data?: any): Promise<DelegatorDetails> {
    return this.protocolV1.getDelegatorDetailsFromPublicKey(
      { type: 'pub', value: publicKey, format: getBytesFormatV1FromV0(publicKey) },
      data
    )
  }

  public async getDelegatorDetailsFromAddress(address: string, data?: any): Promise<DelegatorDetails> {
    return this.protocolV1.getDelegatorDetailsFromAddress(address, data)
  }

  public async getDelegationDetailsFromPublicKey(publicKey: string, delegatees: string[], data?: any): Promise<DelegationDetails> {
    return this.protocolV1.getDelegationDetailsFromPublicKey(
      { type: 'pub', value: publicKey, format: getBytesFormatV1FromV0(publicKey) },
      delegatees,
      data
    )
  }

  public async getDelegationDetailsFromAddress(address: string, delegatees: string[], data?: any): Promise<DelegationDetails> {
    return this.protocolV1.getDelegationDetailsFromAddress(address, delegatees, data)
  }

  public async prepareDelegatorActionFromPublicKey(publicKey: string, type: any, data?: any): Promise<any[]> {
    const transactions = await this.protocolV1.prepareDelegatorActionFromPublicKey(
      { type: 'pub', value: publicKey, format: getBytesFormatV1FromV0(publicKey) },
      type,
      data
    )

    const transactionsV0 = await Promise.all(
      transactions.map((transaction) => this.convertUnsignedTransactionV1ToV0(transaction, publicKey))
    )

    return transactionsV0.map((transaction) => transaction.transaction)
  }
}

// ICoinSubProtocol

export class ICoinSubProtocolAdapter<T extends AirGapAnyProtocol & SubProtocol = AirGapAnyProtocol & SubProtocol>
  extends ICoinProtocolAdapter<T>
  implements ICoinSubProtocol
{
  public readonly isSubProtocol: boolean = true
  public readonly subProtocolType: SubProtocolTypeV0
  public readonly contractAddress?: string

  constructor(
    protocolV1: T,
    protocolMetadata: ProtocolMetadata,
    crypto: CryptoConfiguration | undefined,
    network: ProtocolNetwork | undefined,
    v1BlockExplorer: AirGapBlockExplorer | undefined,
    blockExplorerMetadata: BlockExplorerMetadata | undefined,
    v3SerializerCompanion: AirGapV3SerializerCompanion,
    type: SubProtocolType,
    contractAddress: string | undefined
  ) {
    super(protocolV1, protocolMetadata, crypto, network, v1BlockExplorer, blockExplorerMetadata, v3SerializerCompanion)

    this.subProtocolType = type === 'account' ? SubProtocolTypeV0.ACCOUNT : SubProtocolTypeV0.TOKEN
    this.contractAddress = contractAddress
  }

  public async getIsSubProtocol(): Promise<boolean> {
    return this.isSubProtocol
  }

  public async getSubProtocolType(): Promise<SubProtocolTypeV0> {
    return this.subProtocolType
  }

  public async getContractAddress(): Promise<string | undefined> {
    return this.contractAddress
  }
}

export class ICoinDelegateSubProtocolAdapter<
    T extends AirGapAnyProtocol & AirGapDelegateProtocol & SubProtocol = AirGapAnyProtocol & AirGapDelegateProtocol & SubProtocol
  >
  extends ICoinSubProtocolAdapter<T>
  implements ICoinSubProtocol, ICoinDelegateProtocol
{
  private readonly delegateProtocolAdapter: ICoinDelegateProtocolAdapter<T>

  constructor(
    protocolV1: T,
    protocolMetadata: ProtocolMetadata,
    crypto: CryptoConfiguration | undefined,
    network: ProtocolNetwork | undefined,
    v1BlockExplorer: AirGapBlockExplorer | undefined,
    blockExplorerMetadata: BlockExplorerMetadata | undefined,
    v3SerializerCompanion: AirGapV3SerializerCompanion,
    type: SubProtocolType,
    contractAddress: string | undefined
  ) {
    super(
      protocolV1,
      protocolMetadata,
      crypto,
      network,
      v1BlockExplorer,
      blockExplorerMetadata,
      v3SerializerCompanion,
      type,
      contractAddress
    )

    this.delegateProtocolAdapter = new ICoinDelegateProtocolAdapter(
      protocolV1,
      protocolMetadata,
      crypto,
      network,
      v1BlockExplorer,
      blockExplorerMetadata,
      v3SerializerCompanion
    )
  }

  public async getDefaultDelegatee(): Promise<string> {
    return this.delegateProtocolAdapter.getDefaultDelegatee()
  }

  public async getCurrentDelegateesForPublicKey(publicKey: string, data?: any): Promise<string[]> {
    return this.delegateProtocolAdapter.getCurrentDelegateesForPublicKey(publicKey, data)
  }

  public async getCurrentDelegateesForAddress(address: string, data?: any): Promise<string[]> {
    return this.delegateProtocolAdapter.getCurrentDelegateesForAddress(address, data)
  }

  public async getDelegateeDetails(address: string, data?: any): Promise<DelegateeDetails> {
    return this.delegateProtocolAdapter.getDelegateeDetails(address, data)
  }

  public async isPublicKeyDelegating(publicKey: string, data?: any): Promise<boolean> {
    return this.delegateProtocolAdapter.isPublicKeyDelegating(publicKey, data)
  }

  public async isAddressDelegating(address: string, data?: any): Promise<boolean> {
    return this.delegateProtocolAdapter.isAddressDelegating(address, data)
  }

  public async getDelegatorDetailsFromPublicKey(publicKey: string, data?: any): Promise<DelegatorDetails> {
    return this.delegateProtocolAdapter.getDelegatorDetailsFromPublicKey(publicKey, data)
  }

  public async getDelegatorDetailsFromAddress(address: string, data?: any): Promise<DelegatorDetails> {
    return this.delegateProtocolAdapter.getDelegatorDetailsFromAddress(address, data)
  }

  public async getDelegationDetailsFromPublicKey(publicKey: string, delegatees: string[], data?: any): Promise<DelegationDetails> {
    return this.delegateProtocolAdapter.getDelegationDetailsFromPublicKey(publicKey, delegatees, data)
  }

  public async getDelegationDetailsFromAddress(address: string, delegatees: string[], data?: any): Promise<DelegationDetails> {
    return this.delegateProtocolAdapter.getDelegationDetailsFromAddress(address, delegatees, data)
  }

  public async prepareDelegatorActionFromPublicKey(publicKey: string, type: any, data?: any): Promise<any[]> {
    return this.delegateProtocolAdapter.prepareDelegatorActionFromPublicKey(publicKey, type, data)
  }
}

// Factories

export async function createICoinProtocolAdapter<T extends AirGapAnyProtocol>(
  protocolV1: T,
  blockExplorerV1: AirGapBlockExplorer | undefined,
  v3SerializerCompanion: AirGapV3SerializerCompanion,
  extra: {
    type?: ProtocolConfiguration['type']
    protocolMetadata?: ProtocolMetadata
    crypto?: CryptoConfiguration | null
    network?: ProtocolNetwork | null
    blockExplorerMetadata?: BlockExplorerMetadata | null
  } = {}
): Promise<ICoinProtocolAdapter<T>> {
  const [protocolMetadata, crypto, network, blockExplorerMetadata]: [
    ProtocolMetadata,
    CryptoConfiguration | undefined,
    ProtocolNetwork | undefined,
    BlockExplorerMetadata | undefined
  ] = await Promise.all([
    extra.protocolMetadata ? Promise.resolve(extra.protocolMetadata) : protocolV1.getMetadata(),
    extra.crypto
      ? Promise.resolve(extra.crypto)
      : extra.crypto === null || !isOfflineProtocol(protocolV1) || (extra.type !== 'offline' && extra.type !== 'full')
      ? Promise.resolve(undefined)
      : protocolV1.getCryptoConfiguration(),
    extra.network
      ? Promise.resolve(extra.network)
      : extra.network === null || !isOnlineProtocol(protocolV1) || (extra.type !== 'online' && extra.type !== 'full')
      ? Promise.resolve(undefined)
      : protocolV1.getNetwork(),
    extra.blockExplorerMetadata
      ? Promise.resolve(extra.blockExplorerMetadata)
      : extra.blockExplorerMetadata === null || blockExplorerV1 === undefined || (extra.type !== 'online' && extra.type !== 'full')
      ? Promise.resolve(undefined)
      : blockExplorerV1.getMetadata()
  ])

  if (supportsV1Delegation(protocolV1)) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new ICoinDelegateProtocolAdapter(
      protocolV1,
      protocolMetadata,
      crypto,
      network,
      blockExplorerV1,
      blockExplorerMetadata,
      v3SerializerCompanion
    )
  } else {
    return new ICoinProtocolAdapter(
      protocolV1,
      protocolMetadata,
      crypto,
      network,
      blockExplorerV1,
      blockExplorerMetadata,
      v3SerializerCompanion
    )
  }
}

// eslint-disable-next-line complexity
export async function createICoinSubProtocolAdapter<T extends AirGapAnyProtocol & SubProtocol>(
  protocolV1: T,
  blockExplorerV1: AirGapBlockExplorer | undefined,
  v3SerializerCompanion: AirGapV3SerializerCompanion,
  extra: {
    type?: ProtocolConfiguration['type']
    protocolMetadata?: ProtocolMetadata
    crypto?: CryptoConfiguration | null
    network?: ProtocolNetwork | null
    blockExplorerMetadata?: BlockExplorerMetadata | null
    subType?: SubProtocolType
    contractAddress?: string | null
  } = {}
): Promise<ICoinSubProtocolAdapter<T>> {
  const [protocolMetadata, crypto, network, blockExplorerMetadata, type, contractAddress]: [
    ProtocolMetadata,
    CryptoConfiguration | undefined,
    ProtocolNetwork | undefined,
    BlockExplorerMetadata | undefined,
    SubProtocolType,
    string | undefined
  ] = await Promise.all([
    extra.protocolMetadata ? Promise.resolve(extra.protocolMetadata) : protocolV1.getMetadata(),
    extra.crypto
      ? Promise.resolve(extra.crypto)
      : extra.crypto === null || !isOfflineProtocol(protocolV1) || (extra?.type !== 'offline' && extra?.type !== 'full')
      ? Promise.resolve(undefined)
      : protocolV1.getCryptoConfiguration(),
    extra.network
      ? Promise.resolve(extra.network)
      : extra.network === null || !isOnlineProtocol(protocolV1) || (extra?.type !== 'online' && extra?.type !== 'full')
      ? Promise.resolve(undefined)
      : protocolV1.getNetwork(),
    extra.blockExplorerMetadata
      ? Promise.resolve(extra.blockExplorerMetadata)
      : extra.blockExplorerMetadata === null || blockExplorerV1 === undefined || (extra?.type !== 'online' && extra?.type !== 'full')
      ? Promise.resolve(undefined)
      : blockExplorerV1.getMetadata(),
    extra.subType ? Promise.resolve(extra.subType) : protocolV1.getType(),
    extra.contractAddress
      ? Promise.resolve(extra.contractAddress)
      : extra.contractAddress === null || !hasConfigurableContract(protocolV1)
      ? Promise.resolve(undefined)
      : protocolV1.getContractAddress()
  ])

  if (supportsV1Delegation(protocolV1)) {
    return new ICoinDelegateSubProtocolAdapter(
      protocolV1,
      protocolMetadata,
      crypto,
      network,
      blockExplorerV1,
      blockExplorerMetadata,
      v3SerializerCompanion,
      type,
      contractAddress
    )
  } else {
    return new ICoinSubProtocolAdapter(
      protocolV1,
      protocolMetadata,
      crypto,
      network,
      blockExplorerV1,
      blockExplorerMetadata,
      v3SerializerCompanion,
      type,
      contractAddress
    )
  }
}
