/* eslint-disable max-lines */
/* eslint-disable max-classes-per-file */
import {
  CryptoClient,
  FeeDefaults as FeeDefaultsV0,
  IAirGapTransaction,
  IAirGapTransactionResult,
  ICoinProtocol,
  ICoinSubProtocol,
  IProtocolTransactionCursor,
  NetworkType,
  ProtocolBlockExplorer,
  ProtocolNetwork as ProtocolNetworkV0,
  ProtocolSymbols,
  SignedTransaction as SignedTransactionV0,
  SubProtocolSymbols,
  SubProtocolType as SubProtocolTypeV0,
  UnsignedTransaction as UnsignedTransactionV0
} from '@airgap/coinlib-core'
import { isHex } from '@airgap/coinlib-core/utils/hex'
import { IProtocolAddressCursor, IAirGapAddressResult } from '@airgap/coinlib-core/interfaces/IAirGapAddress'
import {
  AirGapTransactionStatus as AirGapTransactionStatusV0,
  AirGapTransactionWarning,
  AirGapTransactionWarningType
} from '@airgap/coinlib-core/interfaces/IAirGapTransaction'
import { ProtocolOptions } from '@airgap/coinlib-core/utils/ProtocolOptions'
import {
  AddressWithCursor,
  AirGapAnyProtocol,
  AirGapBlockExplorer,
  AirGapTransaction,
  AirGapTransactionStatus,
  AirGapTransactionsWithCursor,
  AirGapUIAction,
  AirGapUIAlert,
  AirGapV3SerializerCompanion,
  Amount,
  Balance,
  BlockExplorerMetadata,
  BytesStringFormat,
  canEncryptAES,
  canEncryptAsymmetric,
  canFetchDataForAddress,
  canFetchDataForMultipleAddresses,
  canSignMessage,
  ExtendedKeyPair,
  ExtendedSecretKey,
  FeeDefaults,
  FeeEstimation,
  hasConfigurableContract,
  hasMultiAddressPublicKeys,
  isAmount,
  isBip32Protocol,
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
  ProtocolMetadata,
  ProtocolNetwork,
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
import { TransactionSignRequest, TransactionSignResponse } from '@airgap/serializer'
import { getProtocolOptionsByIdentifier } from '../utils/protocol/protocol-options'

class ProtocolBlockExplorerAdapter extends ProtocolBlockExplorer {
  constructor(private readonly v1BlockExplorer: AirGapBlockExplorer, url: string) {
    super(url)
  }

  public async getAddressLink(address: string): Promise<string> {
    return this.v1BlockExplorer.createAddressUrl(address)
  }

  public async getTransactionLink(transactionId: string): Promise<string> {
    return this.v1BlockExplorer.createTransactionUrl(transactionId)
  }
}

export class ProtocolNetworkAdapter extends ProtocolNetworkV0 {}

export class ICoinProtocolAdapter implements ICoinProtocol {
  public readonly symbol: string
  public readonly name: string
  public readonly marketSymbol: string
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
  public readonly options: ProtocolOptions
  public readonly cryptoClient: CryptoClient

  private readonly networkV0: ProtocolNetworkV0

  public static async create(
    v1Protocol: AirGapAnyProtocol,
    v1BlockExplorer: AirGapBlockExplorer,
    v3SerializerCompanion: AirGapV3SerializerCompanion,
    extra: {
      protocolMetadata?: ProtocolMetadata
      network?: ProtocolNetwork
      blockExplorerMetadata?: BlockExplorerMetadata
    } = {}
  ): Promise<ICoinProtocolAdapter> {
    const [protocolMetadata, network, blockExplorerMetadata]: [ProtocolMetadata, ProtocolNetwork | undefined, BlockExplorerMetadata] =
      await Promise.all([
        extra.protocolMetadata ? Promise.resolve(extra.protocolMetadata) : v1Protocol.getMetadata(),
        extra.network
          ? Promise.resolve(extra.network)
          : isOnlineProtocol(v1Protocol)
          ? v1Protocol.getNetwork()
          : Promise.resolve(undefined),
        extra.blockExplorerMetadata ? Promise.resolve(extra.blockExplorerMetadata) : v1BlockExplorer.getMetadata()
      ])

    return new ICoinProtocolAdapter(v1Protocol, protocolMetadata, network, v1BlockExplorer, blockExplorerMetadata, v3SerializerCompanion)
  }

  protected constructor(
    public readonly v1Protocol: AirGapAnyProtocol,
    private readonly protocolMetadata: ProtocolMetadata,
    private readonly network: ProtocolNetwork | undefined,
    private readonly v1BlockExplorer: AirGapBlockExplorer,
    private readonly blockExplorerMetadata: BlockExplorerMetadata,
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
    this.decimals = units[mainUnit].decimals

    this.feeSymbol = feeSymbol.value
    this.feeDefaults = this.convertFeeDefaults(feeDefaults)
    this.feeDecimals = feeUnits[mainFeeUnit].decimals

    this.units = Object.entries(protocolMetadata.units).map((entry) => {
      const unitSymbol: string = entry[0]
      const factor: string = new BigNumber(1).shiftedBy(-(maxDecimals - entry[1].decimals)).toFixed()

      return { unitSymbol, factor }
    })

    this.supportsHD = isBip32Protocol(this.v1Protocol)

    this.standardDerivationPath = this.protocolMetadata.account?.standardDerivationPath ?? 'm/'
    this.addressIsCaseSensitive = this.protocolMetadata.account.address?.isCaseSensitive ?? false
    this.addressValidationPattern = this.protocolMetadata.account?.address?.regex ?? '*+'
    this.addressPlaceholder = this.protocolMetadata.account?.address?.placeholder ?? ''

    this.networkV0 = this.getNetwork()

    let knownOptions: ProtocolOptions | undefined
    try {
      knownOptions = getProtocolOptionsByIdentifier(this.protocolMetadata.identifier as ProtocolSymbols)
      // eslint-disable-next-line no-empty
    } catch {}

    this.options = {
      network: this.networkV0,
      config: knownOptions?.config ?? {}
    }
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

  public async getOptions(): Promise<ProtocolOptions> {
    return this.options
  }

  public async getBlockExplorerLinkForAddress(address: string): Promise<string> {
    return this.v1BlockExplorer.createAddressUrl(address)
  }

  public async getBlockExplorerLinkForTxId(txId: string): Promise<string> {
    return this.v1BlockExplorer.createTransactionUrl(txId)
  }

  public async getTransactionsFromPublicKey(
    publicKey: string,
    limit: number,
    cursor?: IProtocolTransactionCursor
  ): Promise<IAirGapTransactionResult> {
    if (!isOnlineProtocol(this.v1Protocol)) {
      throw new Error('Method not supported, required interface: Online.')
    }

    const transactions: AirGapTransactionsWithCursor = await this.v1Protocol.getTransactionsForPublicKey(
      newPublicKey(publicKey, this.getBytesFormat(publicKey)),
      limit,
      cursor as TransactionCursor
    )

    return {
      transactions: await this.convertTransactionDetails(transactions.transactions),
      cursor
    }
  }

  public async getTransactionsFromExtendedPublicKey(
    extendedPublicKey: string,
    limit: number,
    cursor?: IProtocolTransactionCursor
  ): Promise<IAirGapTransactionResult> {
    if (!isOnlineProtocol(this.v1Protocol) || !isBip32Protocol(this.v1Protocol)) {
      throw new Error('Method not supported, required interface: Online, Bip32.')
    }

    const transactions: AirGapTransactionsWithCursor = await this.v1Protocol.getTransactionsForPublicKey(
      newExtendedPublicKey(extendedPublicKey, this.getBytesFormat(extendedPublicKey)),
      limit,
      cursor as TransactionCursor
    )

    return {
      transactions: await this.convertTransactionDetails(transactions.transactions),
      cursor
    }
  }

  public async getTransactionsFromAddresses(
    addresses: string[],
    limit: number,
    cursor?: IProtocolTransactionCursor
  ): Promise<IAirGapTransactionResult> {
    if (!isOnlineProtocol(this.v1Protocol)) {
      throw new Error('Method not supported, required interface: Online, FetchDataForAddress/FetchDataForMultipleAddresses.')
    }

    let transactions: AirGapTransactionsWithCursor
    if (addresses.length === 1 && canFetchDataForAddress(this.v1Protocol)) {
      transactions = await this.v1Protocol.getTransactionsForAddress(addresses[0], limit, cursor as TransactionCursor)
    } else if (canFetchDataForMultipleAddresses(this.v1Protocol)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      transactions = await this.v1Protocol.getTransactionsForAddresses(addresses, limit, cursor as TransactionCursor)
    } else {
      throw new Error('Method not supported, required interface: Online, FetchDataForAddress/FetchDataForMultipleAddresses.')
    }

    return {
      transactions: await this.convertTransactionDetails(transactions.transactions),
      cursor: transactions.cursor ? transactions.cursor : cursor
    }
  }

  public async getBalanceOfAddresses(addresses: string[], _data?: { [key: string]: unknown }): Promise<string> {
    if (!isOnlineProtocol(this.v1Protocol)) {
      throw new Error('Method not supported, required interface: Online, FetchDataForAddress/FetchDataForMultipleAddresses.')
    }

    let balance: Balance
    if (addresses.length === 1 && canFetchDataForAddress(this.v1Protocol)) {
      balance = await this.v1Protocol.getBalanceOfAddress(addresses[0])
    } else if (canFetchDataForMultipleAddresses(this.v1Protocol)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      balance = await this.v1Protocol.getBalanceOfAddresses(addresses)
    } else {
      throw new Error('Method not supported, required interface: Online, FetchDataForAddress/FetchDataForMultipleAddresses.')
    }

    return newAmount(balance.total).blockchain(this.protocolMetadata.units).value
  }

  public async getBalanceOfPublicKey(publicKey: string, _data?: { [key: string]: unknown; addressIndex?: number }): Promise<string> {
    if (!isOnlineProtocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Online.')
    }

    const balance: Balance = await this.v1Protocol.getBalanceOfPublicKey(newPublicKey(publicKey, this.getBytesFormat(publicKey)))

    return newAmount(balance.total).blockchain(this.protocolMetadata.units).value
  }

  public async getBalanceOfExtendedPublicKey(
    extendedPublicKey: string,
    _offset: number,
    _data?: { [key: string]: unknown }
  ): Promise<string> {
    if (!isOnlineProtocol(this.v1Protocol) || !isBip32Protocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Online, Bip32.')
    }

    const balance: Balance = await this.v1Protocol.getBalanceOfPublicKey(
      newExtendedPublicKey(extendedPublicKey, this.getBytesFormat(extendedPublicKey))
    )

    return newAmount(balance.total).blockchain(this.protocolMetadata.units).value
  }

  public async getAvailableBalanceOfAddresses(addresses: string[], _data?: { [key: string]: unknown }): Promise<string> {
    if (!isOnlineProtocol(this.v1Protocol)) {
      throw new Error('Method not supported, required interface: Online, FetchDataForAddress/FetchDataForMultipleAddresses.')
    }

    let balance: Balance
    if (addresses.length === 1 && canFetchDataForAddress(this.v1Protocol)) {
      balance = await this.v1Protocol.getBalanceOfAddress(addresses[0])
    } else if (canFetchDataForMultipleAddresses(this.v1Protocol)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      balance = await this.v1Protocol.getBalanceOfAddresses(addresses)
    } else {
      throw new Error('Method not supported, required interface: Online, FetchDataForAddress/FetchDataForMultipleAddresses.')
    }

    return newAmount(balance.transferable ?? balance.total).blockchain(this.protocolMetadata.units).value
  }

  public async getTransactionStatuses(transactionHash: string[]): Promise<AirGapTransactionStatusV0[]> {
    if (!isOnlineProtocol(this.v1Protocol) || !isTransactionStatusChecker(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Online, TransactionStatusChecker.')
    }

    const statuses: Record<string, AirGapTransactionStatus> = await this.v1Protocol.getTransactionStatus(transactionHash)

    return transactionHash.map((hash: string) => {
      const status: AirGapTransactionStatus = statuses[hash]

      return this.convertTransactionStatus(status)
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
    if (!isOnlineProtocol(this.v1Protocol) || !isBip32Protocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Online, Bip32.')
    }

    const maxAmount: Amount = await this.v1Protocol.getTransactionMaxAmountWithPublicKey(
      newExtendedPublicKey(extendedPublicKey, this.getBytesFormat(extendedPublicKey)),
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
    if (!isOnlineProtocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Online.')
    }

    const maxAmount: Amount = await this.v1Protocol.getTransactionMaxAmountWithPublicKey(
      newPublicKey(publicKey, this.getBytesFormat(publicKey)),
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
    _data?: { [key: string]: unknown }
  ): Promise<FeeDefaultsV0> {
    if (!isOnlineProtocol(this.v1Protocol) || !isBip32Protocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Online, Bip32.')
    }

    const feeEstimation: FeeEstimation = await this.v1Protocol.getTransactionFeeWithPublicKey(
      newExtendedPublicKey(publicKey, this.getBytesFormat(publicKey)),
      this.combineTransactionDetails(recipients, values)
    )

    const feeDefaults: FeeDefaults = isAmount(feeEstimation)
      ? { low: feeEstimation, medium: feeEstimation, high: feeEstimation }
      : feeEstimation

    return this.convertFeeDefaults(feeDefaults)
  }

  public async estimateFeeDefaultsFromPublicKey(
    publicKey: string,
    recipients: string[],
    values: string[],
    _data?: { [key: string]: unknown }
  ): Promise<FeeDefaultsV0> {
    if (!isOnlineProtocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Online.')
    }

    if (recipients.length !== values.length) {
      throw new Error('Recipients length must match values length.')
    }

    const transactionDetails: TransactionDetails[] = recipients.map((recipient: string, index: number) => ({
      to: recipient,
      amount: newAmount(values[index], 'blockchain')
    }))

    const feeEstimation: FeeEstimation = await this.v1Protocol.getTransactionFeeWithPublicKey(
      newPublicKey(publicKey, this.getBytesFormat(publicKey)),
      transactionDetails
    )

    const feeDefaults: FeeDefaults = isAmount(feeEstimation)
      ? { low: feeEstimation, medium: feeEstimation, high: feeEstimation }
      : feeEstimation

    return this.convertFeeDefaults(feeDefaults)
  }

  public async prepareTransactionFromExtendedPublicKey(
    extendedPublicKey: string,
    _offset: number,
    recipients: string[],
    values: string[],
    fee: string,
    _extras?: { [key: string]: unknown }
  ): Promise<any> {
    if (!isOnlineProtocol(this.v1Protocol) || !isBip32Protocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Online.')
    }

    const transaction: UnsignedTransaction = await this.v1Protocol.prepareTransactionWithPublicKey(
      newExtendedPublicKey(extendedPublicKey, this.getBytesFormat(extendedPublicKey)),
      this.combineTransactionDetails(recipients, values),
      {
        fee: newAmount(fee, 'blockchain')
      }
    )

    const transactionV0 = await this.convertV1UnsignedTransactionToV0(transaction, extendedPublicKey)

    return transactionV0.transaction
  }

  public async prepareTransactionFromPublicKey(
    publicKey: string,
    recipients: string[],
    values: string[],
    fee: string,
    _extras?: { [key: string]: unknown }
  ): Promise<any> {
    if (!isOnlineProtocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Online.')
    }

    const transaction: UnsignedTransaction = await this.v1Protocol.prepareTransactionWithPublicKey(
      newPublicKey(publicKey, this.getBytesFormat(publicKey)),
      this.combineTransactionDetails(recipients, values),
      {
        fee: newAmount(fee, 'blockchain')
      }
    )

    const transactionV0 = await this.convertV1UnsignedTransactionToV0(transaction, publicKey)

    return transactionV0.transaction
  }

  public async broadcastTransaction(rawTransaction: any): Promise<string> {
    if (!isOnlineProtocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Online.')
    }

    const transaction = { transaction: rawTransaction, accountIdentifier: '' }
    const signed: SignedTransaction = await this.convertV0SignedTransactionToV1(transaction)

    return this.v1Protocol.broadcastTransaction(signed)
  }

  public async getAddressFromPublicKey(publicKey: string, _cursor?: IProtocolAddressCursor): Promise<IAirGapAddressResult> {
    const address: AddressWithCursor | string = await this.v1Protocol.getAddressFromPublicKey(
      newPublicKey(publicKey, this.getBytesFormat(publicKey))
    )

    return {
      address: typeof address === 'string' ? address : address.address,
      cursor: typeof address === 'object' ? address.cursor : { hasNext: false }
    }
  }

  public async getAddressesFromPublicKey(publicKey: string, _cursor?: IProtocolAddressCursor): Promise<IAirGapAddressResult[]> {
    if (hasMultiAddressPublicKeys(this.v1Protocol)) {
      const pk: PublicKey = newPublicKey(publicKey, this.getBytesFormat(publicKey))
      const addresses: IAirGapAddressResult[] = []
      const firstAddress: AddressWithCursor | string = await this.v1Protocol.getAddressFromPublicKey(pk)

      let nextAddress: AddressWithCursor | undefined =
        typeof firstAddress === 'string' ? { address: firstAddress, cursor: { hasNext: false } } : firstAddress
      while (nextAddress !== undefined && nextAddress.cursor.hasNext) {
        addresses.push(nextAddress)
        nextAddress = await this.v1Protocol.getNextAddressFromPublicKey(pk, nextAddress.cursor)
      }

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
    if (!isBip32Protocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Bip32.')
    }

    const derivedPublicKey: PublicKey = await this.v1Protocol.deriveFromExtendedPublicKey(
      newExtendedPublicKey(extendedPublicKey, this.getBytesFormat(extendedPublicKey)),
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
    if (!isBip32Protocol(this.v1Protocol)) {
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
    _data?: { [key: string]: unknown }
  ): Promise<IAirGapTransaction[]> {
    const unsigned: UnsignedTransaction = await this.convertV0UnsignedTransactionToV1(transaction)

    let transactions: AirGapTransaction[]
    if (this.isExtendedPublicKey(transaction.publicKey)) {
      if (!isBip32Protocol(this.v1Protocol)) {
        throw new Error('Method not supported, required inferface: Bip32.')
      }

      transactions = await this.v1Protocol.getDetailsFromTransaction(
        unsigned,
        newExtendedPublicKey(transaction.publicKey, this.getBytesFormat(transaction.publicKey))
      )
    } else {
      transactions = await this.v1Protocol.getDetailsFromTransaction(
        unsigned,
        newPublicKey(transaction.publicKey, this.getBytesFormat(transaction.publicKey))
      )
    }

    const transactionsV0: IAirGapTransaction[] = await this.convertTransactionDetails(transactions)

    return transactionsV0.map(
      (tx: IAirGapTransaction): IAirGapTransaction => ({
        ...tx,
        transactionDetails: tx.transactionDetails ?? transaction.transaction
      })
    )
  }

  public async getTransactionDetailsFromSigned(
    transaction: SignedTransactionV0,
    _data?: { [key: string]: unknown }
  ): Promise<IAirGapTransaction[]> {
    const signed: SignedTransaction = await this.convertV0SignedTransactionToV1(transaction)

    let transactions: AirGapTransaction[]
    if (this.isExtendedPublicKey(transaction.accountIdentifier)) {
      if (!isBip32Protocol(this.v1Protocol)) {
        throw new Error('Method not supported, required inferface: Bip32.')
      }

      transactions = await this.v1Protocol.getDetailsFromTransaction(
        signed,
        newExtendedPublicKey(transaction.accountIdentifier, this.getBytesFormat(transaction.accountIdentifier))
      )
    } else {
      transactions = await this.v1Protocol.getDetailsFromTransaction(
        signed,
        newPublicKey(transaction.accountIdentifier, this.getBytesFormat(transaction.accountIdentifier))
      )
    }

    const transactionsV0: IAirGapTransaction[] = await this.convertTransactionDetails(transactions)

    return transactionsV0.map(
      (tx: IAirGapTransaction): IAirGapTransaction => ({
        ...tx,
        transactionDetails: tx.transactionDetails ?? transaction.transaction
      })
    )
  }

  public async verifyMessage(message: string, signature: string, publicKey: string): Promise<boolean> {
    if (!isOfflineProtocol(this.v1Protocol) || !canSignMessage(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Offline, SignMessage.')
    }

    return this.v1Protocol.verifyMessageWithPublicKey(
      message,
      newSignature(signature, this.getBytesFormat(signature)),
      newPublicKey(publicKey, this.getBytesFormat(publicKey))
    )
  }

  public async encryptAsymmetric(payload: string, publicKey: string): Promise<string> {
    if (!isOfflineProtocol(this.v1Protocol) || !canEncryptAsymmetric(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Offline, AsymmetricEncryption.')
    }

    return this.v1Protocol.encryptAsymmetricWithPublicKey(payload, newPublicKey(publicKey, this.getBytesFormat(publicKey)))
  }

  public async getPublicKeyFromMnemonic(mnemonic: string, derivationPath: string, password?: string): Promise<string> {
    if (!isOfflineProtocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Offline.')
    }

    const keyPair: KeyPair = await this.v1Protocol.getKeyPairFromSecret({ type: 'mnemonic', value: mnemonic, password }, derivationPath)

    return keyPair.publicKey.value
  }

  public async getPrivateKeyFromMnemonic(mnemonic: string, derivationPath: string, password?: string): Promise<string> {
    if (!isOfflineProtocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Offline.')
    }

    const keyPair: KeyPair = await this.v1Protocol.getKeyPairFromSecret({ type: 'mnemonic', value: mnemonic, password }, derivationPath)

    return keyPair.secretKey.value
  }

  public async getExtendedPublicKeyFromMnemonic(mnemonic: string, derivationPath: string, password?: string): Promise<string> {
    if (!isOfflineProtocol(this.v1Protocol) || !isBip32Protocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Offline, Bip32.')
    }

    const keyPair: ExtendedKeyPair = await this.v1Protocol.getExtendedKeyPairFromSecret(
      { type: 'mnemonic', value: mnemonic, password },
      derivationPath
    )

    return keyPair.publicKey.value
  }

  public async getExtendedPrivateKeyFromMnemonic(mnemonic: string, derivationPath: string, password?: string): Promise<string> {
    if (!isOfflineProtocol(this.v1Protocol) || !isBip32Protocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Offline, Bip32.')
    }

    const keyPair: ExtendedKeyPair = await this.v1Protocol.getExtendedKeyPairFromSecret(
      { type: 'mnemonic', value: mnemonic, password },
      derivationPath
    )

    return keyPair.secretKey.value
  }

  public async getPublicKeyFromHexSecret(secret: string, derivationPath: string): Promise<string> {
    if (!isOfflineProtocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Offline, Bip32.')
    }

    const keyPair: KeyPair = await this.v1Protocol.getKeyPairFromSecret({ type: 'hex', value: secret }, derivationPath)

    return keyPair.publicKey.value
  }

  public async getPrivateKeyFromHexSecret(secret: string, derivationPath: string): Promise<string> {
    if (!isOfflineProtocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Offline.')
    }

    const keyPair: KeyPair = await this.v1Protocol.getKeyPairFromSecret({ type: 'hex', value: secret }, derivationPath)

    return keyPair.secretKey.value
  }

  public async getExtendedPublicKeyFromHexSecret(secret: string, derivationPath: string): Promise<string> {
    if (!isOfflineProtocol(this.v1Protocol) || !isBip32Protocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Offline, Bip32.')
    }

    const keyPair: ExtendedKeyPair = await this.v1Protocol.getExtendedKeyPairFromSecret({ type: 'hex', value: secret }, derivationPath)

    return keyPair.publicKey.value
  }

  public async getExtendedPrivateKeyFromHexSecret(secret: string, derivationPath: string): Promise<string> {
    if (!isOfflineProtocol(this.v1Protocol) || !isBip32Protocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Offline, Bip32.')
    }

    const keyPair: ExtendedKeyPair = await this.v1Protocol.getExtendedKeyPairFromSecret({ type: 'hex', value: secret }, derivationPath)

    return keyPair.secretKey.value
  }

  public async signWithExtendedPrivateKey(extendedPrivateKey: string, transaction: any, childDerivationPath?: string): Promise<string> {
    if (!isOfflineProtocol(this.v1Protocol) || !isBip32Protocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Offline, Bip32.')
    }

    const unsigned: UnsignedTransaction = await this.convertV0UnsignedTransactionToV1({
      transaction,
      publicKey: ''
    })

    const extendedSecretKey: ExtendedSecretKey = newExtendedSecretKey(extendedPrivateKey, this.getBytesFormat(extendedPrivateKey))

    const secretKey: ExtendedSecretKey | SecretKey = childDerivationPath
      ? await this.deriveSecretKey(extendedSecretKey, childDerivationPath)
      : extendedSecretKey

    const signed: SignedTransaction = await this.v1Protocol.signTransactionWithSecretKey(unsigned, secretKey)
    const signedV0: TransactionSignResponse = await this.convertV1SignedTransactionToV0(signed, '')

    return signedV0.transaction
  }

  public async signWithPrivateKey(privateKey: string, transaction: any): Promise<string> {
    if (!isOfflineProtocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Offline.')
    }

    const unsigned: UnsignedTransaction = await this.convertV0UnsignedTransactionToV1({
      transaction,
      publicKey: ''
    })

    const signed: SignedTransaction = await this.v1Protocol.signTransactionWithSecretKey(
      unsigned,
      newSecretKey(privateKey, this.getBytesFormat(privateKey))
    )
    const signedV0: TransactionSignResponse = await this.convertV1SignedTransactionToV0(signed, '')

    return signedV0.transaction
  }

  public async signMessage(message: string, keypair: { publicKey?: string; privateKey: string }): Promise<string> {
    if (!isOfflineProtocol(this.v1Protocol) || !canSignMessage(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Offline, SignMessage.')
    }

    const signature: Signature = await this.v1Protocol.signMessageWithKeyPair(message, {
      secretKey: newSecretKey(keypair.privateKey, this.getBytesFormat(keypair.privateKey)),
      publicKey: newPublicKey(keypair.publicKey ?? '', this.getBytesFormat(keypair.publicKey ?? ''))
    })

    return signature.value
  }

  public async decryptAsymmetric(encryptedPayload: string, keypair: { publicKey?: string; privateKey: string }): Promise<string> {
    if (!isOfflineProtocol(this.v1Protocol) || !canEncryptAsymmetric(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Offline, AsymmetricEncryption.')
    }

    return this.v1Protocol.decryptAsymmetricWithKeyPair(encryptedPayload, {
      secretKey: newSecretKey(keypair.privateKey, this.getBytesFormat(keypair.privateKey)),
      publicKey: newPublicKey(keypair.publicKey ?? '', this.getBytesFormat(keypair.publicKey ?? ''))
    })
  }

  public async encryptAES(payload: string, privateKey: string): Promise<string> {
    if (!isOfflineProtocol(this.v1Protocol) || !canEncryptAES(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Offline, AES.')
    }

    return this.v1Protocol.encryptAESWithSecretKey(payload, newSecretKey(privateKey, this.getBytesFormat(privateKey)))
  }

  public async decryptAES(encryptedPayload: string, privateKey: string): Promise<string> {
    if (!isOfflineProtocol(this.v1Protocol) || !canEncryptAES(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Offline, AES.')
    }

    return this.v1Protocol.decryptAESWithSecretKey(encryptedPayload, newSecretKey(privateKey, this.getBytesFormat(privateKey)))
  }

  public async getPrivateKeyFromExtendedPrivateKey(extendedPrivateKey: string, childDerivationPath: string): Promise<string> {
    if (!isOfflineProtocol(this.v1Protocol) || !isBip32Protocol(this.v1Protocol)) {
      throw new Error('Method not supported, required inferface: Offline, Bip32.')
    }

    const secretKey: SecretKey = await this.deriveSecretKey(
      newExtendedSecretKey(extendedPrivateKey, this.getBytesFormat(extendedPrivateKey)),
      childDerivationPath
    )

    return secretKey.value
  }

  private getNetwork(): ProtocolNetworkV0 {
    let knownOptions: ProtocolOptions | undefined
    try {
      knownOptions = getProtocolOptionsByIdentifier(this.identifier)
      // eslint-disable-next-line no-empty
    } catch {}

    const networkType: NetworkType =
      this.network?.type === 'mainnet'
        ? NetworkType.MAINNET
        : this.network?.type === 'testnet'
        ? NetworkType.TESTNET
        : this.network?.type === 'custom'
        ? NetworkType.CUSTOM
        : knownOptions?.network.type ?? NetworkType.MAINNET

    return new ProtocolNetworkAdapter(
      this.network?.name ?? knownOptions?.network.name ?? '',
      networkType,
      this.network?.rpcUrl ?? knownOptions?.network.rpcUrl ?? '',
      new ProtocolBlockExplorerAdapter(this.v1BlockExplorer, this.blockExplorerMetadata.url),
      knownOptions?.network.extras ?? {}
    )
  }

  private async deriveSecretKey(extendedSecretKey: ExtendedSecretKey, childDerivationPath: string): Promise<SecretKey> {
    if (!isOfflineProtocol(this.v1Protocol) || !isBip32Protocol(this.v1Protocol)) {
      throw new Error(`Protocol doesn't support secret key derivation, missing inferface: Offline, Bip32.`)
    }

    if (childDerivationPath.startsWith('m')) {
      throw new Error('Received full derivation path, expected child derivation path')
    }

    if (childDerivationPath.toLowerCase().includes('h') || childDerivationPath.includes(`'`)) {
      throw new Error('Child derivation path cannot include hardened children')
    }

    const [visibilityIndex, addressIndex]: number[] = childDerivationPath.split('/').map((index: string) => parseInt(index, 10))

    return this.v1Protocol.deriveFromExtendedSecretKey(extendedSecretKey, visibilityIndex, addressIndex)
  }

  private async getSerializerIdentifier(): Promise<string> {
    const identifier: string = await this.getIdentifier()

    return identifier.startsWith(SubProtocolSymbols.ETH_ERC20) ? SubProtocolSymbols.ETH_ERC20 : identifier
  }

  private async convertV0UnsignedTransactionToV1(transaction: TransactionSignRequest): Promise<UnsignedTransaction> {
    const identifier: string = await this.getSerializerIdentifier()

    return this.v3SerializerCompanion.fromTransactionSignRequest(identifier, transaction)
  }

  private async convertV1UnsignedTransactionToV0(
    transaction: UnsignedTransaction,
    publicKey: string,
    callbackUrl?: string
  ): Promise<TransactionSignRequest> {
    const identifier: string = await this.getSerializerIdentifier()

    return this.v3SerializerCompanion.toTransactionSignRequest(identifier, transaction, publicKey, callbackUrl)
  }

  private async convertV0SignedTransactionToV1(transaction: TransactionSignResponse): Promise<SignedTransaction> {
    const identifier: string = await this.getSerializerIdentifier()

    return this.v3SerializerCompanion.fromTransactionSignResponse(identifier, transaction)
  }

  private async convertV1SignedTransactionToV0(
    transaction: SignedTransaction,
    accountIdentifier: string
  ): Promise<TransactionSignResponse> {
    const identifier: string = await this.getSerializerIdentifier()

    return this.v3SerializerCompanion.toTransactionSignResponse(identifier, transaction, accountIdentifier)
  }

  private convertFeeDefaults(feeDefaults: FeeDefaults): FeeDefaultsV0 {
    const feeUnits: ProtocolUnitsMetadata = this.protocolMetadata.fee?.units ?? this.protocolMetadata.units
    const feeUnit: string = this.protocolMetadata.fee?.mainUnit ?? this.protocolMetadata.mainUnit

    return {
      low: new BigNumber(newAmount(feeDefaults.low).convert(feeUnit, feeUnits).value).toFixed(),
      medium: new BigNumber(newAmount(feeDefaults.medium).convert(feeUnit, feeUnits).value).toFixed(),
      high: new BigNumber(newAmount(feeDefaults.high).convert(feeUnit, feeUnits).value).toFixed()
    }
  }

  private async convertTransactionDetails(txs: AirGapTransaction[]): Promise<IAirGapTransaction[]> {
    const units: ProtocolUnitsMetadata = this.protocolMetadata.units
    const feeUnits: ProtocolUnitsMetadata = this.protocolMetadata.fee?.units ?? units

    return Promise.all(
      txs.map(
        async (tx: AirGapTransaction): Promise<IAirGapTransaction> => ({
          from: tx.from,
          to: tx.to,
          isInbound: tx.isInbound,

          amount: newAmount(tx.amount).blockchain(units).value,
          fee: newAmount(tx.fee).blockchain(feeUnits).value,

          timestamp: tx.timestamp,

          protocolIdentifier: this.protocolMetadata.identifier as ProtocolSymbols,
          network: this.networkV0,

          data: typeof tx.arbitraryData === 'string' ? tx.arbitraryData : tx.arbitraryData?.[1],

          hash: tx.status?.hash,
          blockHeight: tx.status?.block,
          status: tx.status ? this.convertTransactionStatus(tx.status) : undefined,

          warnings: tx.uiAlerts ? this.convertUIAlerts(tx.uiAlerts) : undefined,

          extra: {
            ...tx.extra,
            type: tx.type
          },
          transactionDetails: tx.json
        })
      )
    )
  }

  private convertTransactionStatus(status: AirGapTransactionStatus): AirGapTransactionStatusV0 {
    return status.type === 'applied'
      ? AirGapTransactionStatusV0.APPLIED
      : status.type === 'failed'
      ? AirGapTransactionStatusV0.FAILED
      : undefined
  }

  private combineTransactionDetails(recipients: string[], values: string[]): TransactionDetails[] {
    if (recipients.length !== values.length) {
      throw new Error('Recipients length must match values length.')
    }

    return recipients.map((recipient: string, index: number) => ({
      to: recipient,
      amount: newAmount(values[index], 'blockchain')
    }))
  }

  private convertUIAlerts(alerts: AirGapUIAlert[]): AirGapTransactionWarning[] {
    return alerts.map((alert: AirGapUIAlert) => ({
      type:
        alert.type === 'success'
          ? AirGapTransactionWarningType.SUCCESS
          : alert.type === 'info'
          ? AirGapTransactionWarningType.NOTE
          : alert.type === 'warning'
          ? AirGapTransactionWarningType.WARNING
          : AirGapTransactionWarningType.ERROR,
      title: alert.title.value,
      description: alert.description.value,
      icon: alert.icon,
      actions: alert.actions ? this.convertUIActions(alert.actions) : undefined
    }))
  }

  private convertUIActions(actions: AirGapUIAction[]): AirGapTransactionWarning['actions'] {
    return actions.map((action: AirGapUIAction) => ({
      text: action.text.value,
      link: ''
    }))
  }

  private getBytesFormat(bytes: string): BytesStringFormat {
    return isHex(bytes) ? 'hex' : 'encoded'
  }

  private isExtendedPublicKey(publicKey: string): boolean {
    return publicKey.startsWith('xpub') || publicKey.startsWith('ypub') || publicKey.startsWith('zpub')
  }
}

export class ICoinSubProtocolAdapter extends ICoinProtocolAdapter implements ICoinSubProtocol {
  public readonly isSubProtocol: boolean = true
  public readonly subProtocolType: SubProtocolTypeV0
  public readonly contractAddress?: string

  public static async create(
    v1Protocol: AirGapAnyProtocol & SubProtocol,
    v1BlockExplorer: AirGapBlockExplorer,
    v3SerializerCompanion: AirGapV3SerializerCompanion,
    extra: {
      protocolMetadata?: ProtocolMetadata
      network?: ProtocolNetwork
      blockExplorerMetadata?: BlockExplorerMetadata
      type?: SubProtocolType
      contractAddress?: string
    } = {}
  ): Promise<ICoinSubProtocolAdapter> {
    const [protocolMetadata, network, blockExplorerMetadata, type, contractAddress]: [
      ProtocolMetadata,
      ProtocolNetwork | undefined,
      BlockExplorerMetadata,
      SubProtocolType,
      string | undefined
    ] = await Promise.all([
      extra.protocolMetadata ? Promise.resolve(extra.protocolMetadata) : v1Protocol.getMetadata(),
      extra.network ? Promise.resolve(extra.network) : isOnlineProtocol(v1Protocol) ? v1Protocol.getNetwork() : Promise.resolve(undefined),
      extra.blockExplorerMetadata ? Promise.resolve(extra.blockExplorerMetadata) : v1BlockExplorer.getMetadata(),
      extra.type ? Promise.resolve(extra.type) : v1Protocol.getType(),
      extra.contractAddress
        ? Promise.resolve(extra.contractAddress)
        : hasConfigurableContract(v1Protocol)
        ? v1Protocol.getContractAddress()
        : Promise.resolve(undefined)
    ])

    return new ICoinSubProtocolAdapter(
      v1Protocol,
      protocolMetadata,
      network,
      v1BlockExplorer,
      blockExplorerMetadata,
      v3SerializerCompanion,
      type,
      contractAddress
    )
  }

  private constructor(
    public readonly v1Protocol: AirGapAnyProtocol & SubProtocol,
    protocolMetadata: ProtocolMetadata,
    network: ProtocolNetwork | undefined,
    v1BlockExplorer: AirGapBlockExplorer,
    blockExplorerMetadata: BlockExplorerMetadata,
    v3SerializerCompanion: AirGapV3SerializerCompanion,
    type: SubProtocolType,
    contractAddress: string | undefined
  ) {
    super(v1Protocol, protocolMetadata, network, v1BlockExplorer, blockExplorerMetadata, v3SerializerCompanion)

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
