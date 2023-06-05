var window = self

// available as airgapCoinLib due to browserify postInstall hook
self.importScripts('../libs/airgap-coin-lib.browserify.js')

const modules = [
  new airgapCoinLib.aeternity.AeternityModule(),
  new airgapCoinLib.bitcoin.BitcoinModule(),
  new airgapCoinLib.ethereum.EthereumModule(),
  new airgapCoinLib.groestlcoin.GroestlcoinModule(),
  new airgapCoinLib.tezos.TezosModule(),
  new airgapCoinLib.cosmos.CosmosModule(),
  new airgapCoinLib.coreum.CoreumModule(),
  new airgapCoinLib.polkadot.PolkadotModule(),
  new airgapCoinLib.moonbeam.MoonbeamModule(),
  new airgapCoinLib.astar.AstarModule(),
  new airgapCoinLib.icp.ICPModule(),
  new airgapCoinLib.optimism.OptimismModule()
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
