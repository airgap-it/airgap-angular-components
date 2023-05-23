import { MainProtocolSymbols } from '@airgap/coinlib-core'
import { EthereumTransactionSignResponse } from '@airgap/ethereum'
import { IACMessageDefinitionObjectV3, IACMessageType } from '@airgap/serializer'
import { MetamaskGenerator } from './metamask-generator'

describe('MetamaskGenerator', () => {
  let generator: MetamaskGenerator

  beforeEach(() => {
    generator = new MetamaskGenerator()
  })

  it('should create', () => {
    expect(generator).toBeTruthy()
  })

  it('should generate an account share message', async () => {
    const data: IACMessageDefinitionObjectV3 = {
      id: 58333009,
      protocol: MainProtocolSymbols.ETH,
      type: IACMessageType.AccountShareResponse,
      payload: {
        publicKey: 'xpub6DCoCpSuQZB2jawqnGMEPS63ePKWkwWPH4TU45Q7LPXWuNd8TMtVxRrgjtEshuqpK3mdhaWHPFsBngh5GFZaM6si3yZdUsT8ddYM3PwnATt',
        isExtendedPublicKey: true,
        derivationPath: "m/44'/60'/0'",
        masterFingerprint: 'dc58cae3',
        isActive: true,
        groupId: 'dc58cae3',
        groupLabel: 'MM'
      }
    }

    await generator.create([data], 300, 150)
    const part = await generator.nextPart()
    console.log('part', part)
    expect(part).toBe(
      'UR:CRYPTO-HDKEY/ONAXHDCLAOWDVEROKOPDINHSEEROISYALKSAYKCTJSHEDPRNUYJYFGROVAWEWFTYGHCEGLRPKGAAHDCXTPLFJSLUKNFWLAISAXWYPALBJYLSWZAMCXHSCYUYLOZTMWFNLDLGSKPYPTGSDECFAMTAADDYOEADLNCSDWYKCSFNYKAEYKAOCYHNRPLUINAYCYIEIAECETASJEFPINJPFLHSJOCXDPCXGTGTCHMSTSVA'
    )
  })

  it('should generate a signed ETH message', async () => {
    const payload: EthereumTransactionSignResponse = {
      transaction:
        'f86c808504a817c800825208944a1e1d37462a422873bfccb1e705b05cc4bd922e880de0b6b3a76400008026a00678aaa8f8fd478952bf46044589f5489e809c5ae5717dfe6893490b1f98b441a06a82b82dad7c3232968ec3aa2bba32879b3ecdb877934915d7e65e095fe53d5d',
      accountIdentifier: '000000'
    }
    const data: IACMessageDefinitionObjectV3 = {
      id: 49255571,
      type: IACMessageType.TransactionSignResponse,
      protocol: MainProtocolSymbols.ETH,
      payload
    }

    await generator.create([data], 300, 150)

    const part1 = await generator.nextPart()

    console.log('part1', part1)

    // Signatures are always different
    expect(part1.length).toBe(
      'UR:ETH-SIGNATURE/OEADTPDAGDOSKIVLSTSWEOFXDNOXLUFPECHLCAIHCPAOHDFPAMKSPKPDYAZCFLLDGMRSFGAAFELDYKFDNNLANSHTVWJSKIZEISMUGABDCTMKQZFPIMLFRODPPMKEEYEYMTMNSRPKDNRDEYLTNDFMSNROKTMUGABZTSVAHYASHEVWFSHLDSBSGREYDK'
        .length
    )
  })
})
