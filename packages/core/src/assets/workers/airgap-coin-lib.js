var window = self

// available as airgapCoinLib due to browserify postInstall hook
self.importScripts('../libs/airgap-coin-lib.browserify.js')
self.importScripts('../libs/airgap-aeternity.browserify.js')
self.importScripts('../libs/airgap-astar.browserify.js')
self.importScripts('../libs/airgap-bitcoin.browserify.js')
self.importScripts('../libs/airgap-cosmos.browserify.js')
self.importScripts('../libs/airgap-ethereum.browserify.js')
self.importScripts('../libs/airgap-groestlcoin.browserify.js')
self.importScripts('../libs/airgap-moonbeam.browserify.js')
self.importScripts('../libs/airgap-polkadot.browserify.js')
self.importScripts('../libs/airgap-tezos.browserify.js')
self.importScripts('../libs/airgap-icp.browserify.js')
self.importScripts('../libs/airgap-coreum.browserify.js')
self.importScripts('../libs/airgap-optimism.browserify.js')

const modules = [
  new airgapCoinLibAeternity.AeternityModule(),
  new airgapCoinLibBitcoin.BitcoinModule(),
  new airgapCoinLibEthereum.EthereumModule(),
  new airgapCoinLibGroestlcoin.GroestlcoinModule(),
  new airgapCoinLibTezos.TezosModule(),
  new airgapCoinLibCosmos.CosmosModule(),
  new airgapCoinLibCoreum.CoreumModule(),
  new airgapCoinLibPolkadot.PolkadotModule(),
  new airgapCoinLibMoonbeam.MoonbeamModule(),
  new airgapCoinLibAstar.AstarModule(),
  new airgapCoinLibICP.ICPModule(),
  new airgapCoinLibOptimism.OptimismModule()
]

const HEX_REGEX = new RegExp(`^(0x)?[0-9a-fA-F]*$`)
const isHexString = (string) => {
  return typeof string === 'string' && HEX_REGEX.test(string)
}

const getPublicKeyV1 = (type, publicKey) => {
  return { type, value: publicKey, format: isHexString(publicKey) ? 'hex' : 'encoded' }
}

const normalizeAddress = (address) => {
  return typeof address === 'string'
    ? { address, cursor: { hasNext: false }}
    : address
}

const getProtocolByIdentifier = async (identifier, isExtendedPublicKey) => {
  const module = modules.find((module) => {
    const protocolConfiguration = module.supportedProtocols[identifier]

    return protocolConfiguration?.type === 'online' || protocolConfiguration?.type === 'full'
  })

  if (module === undefined) {
    return undefined
  }

  const protocol = await module.createOnlineProtocol(identifier)
  if (protocol === undefined) {
    return undefined
  }

  const metadata = await protocol.getMetadata()

  protocol.identifier = metadata.identifier
  protocol.getIdentifier = async () => {
    return metadata.identifier
  }

  if (isExtendedPublicKey) {
    protocol.getAddressesFromExtendedPublicKey = async (extendedPublicKey, visibilityDerivationIndex, addressCount, offset) => {
      const extendedPublicKeyV1 = getPublicKeyV1('xpub', extendedPublicKey)
      const generatorArray = Array.from(new Array(addressCount), (_, i) => i + offset)

      return Promise.all(
        generatorArray.map(async (x) => {
          const derivedPublicKey = await protocol.deriveFromExtendedPublicKey(extendedPublicKeyV1, visibilityDerivationIndex, x)

          return normalizeAddress(await protocol.getAddressFromPublicKey(derivedPublicKey))
        })
      )
    }
  } else {
    protocol.getAddressesFromPublicKey = async (publicKey, cursor) => {
      const publicKeyV1 = getPublicKeyV1('pub', publicKey)
      const addresses = 'getInitialAddressesFromPublicKey' in protocol
        ? await protocol.getInitialAddressesFromPublicKey(publicKeyV1)
        : [await protocol.getAddressFromPublicKey(publicKeyV1)]

      return addresses.map(normalizeAddress)
    }
  }

  return protocol
}

self.onmessage = (event) => {
  const wallets = Array.isArray(event.data.wallets) ? event.data.wallets : [event.data.wallets]
  const amount = event.data.amount ? event.data.amount : 50

  Promise.all(
    wallets.map(async (wallet) => {
      let protocol = await getProtocolByIdentifier(wallet.protocolIdentifier, wallet.isExtendedPublicKey)

      const airGapWallet = new airgapCoinLib.AirGapWallet(
        protocol,
        wallet.publicKey,
        wallet.isExtendedPublicKey,
        wallet.derivationPath,
        wallet.masterFingerprint,
        wallet.status
      )

      return airGapWallet.deriveAddresses(amount).then((addresses) => {
        return { addresses: addresses, key: `${wallet.protocolIdentifier}_${wallet.publicKey}` }
      })
    })
  ).then(async (addressesByKeys) => {
    const derivedAddressesMap = addressesByKeys.reduce(
      (obj, addressesByKey) => Object.assign(obj, { [addressesByKey.key]: addressesByKey.addresses }),
      {}
    )

    self.postMessage(derivedAddressesMap)
  })
}
