import { IACMessageDefinitionObjectV3, IACMessageType, MainProtocolSymbols } from '@airgap/coinlib-core'
import { SerializerV2Generator } from './serializer-v2-generator'

describe('SerializerV2Generator', () => {
  let generator: SerializerV2Generator

  beforeEach(() => {
    generator = new SerializerV2Generator()
  })

  it('should create', () => {
    expect(generator).toBeTruthy()
  })

  it('should generate a serialized QR string from IACMessageDefinitionObjectV3', async () => {
    const data: IACMessageDefinitionObjectV3 = {
      id: 79370700,
      protocol: MainProtocolSymbols.XTZ,
      type: IACMessageType.AccountShareResponse,
      payload: {
        publicKey: '9430c2ac8fe1403c6cbbee3a98b19f3f3bbdd89d0659b3eb6e4106a5cbe41351',
        isExtendedPublicKey: false,
        derivationPath: 'm/44h/1729h/0h/0h',
        masterFingerprint: '558f6baa',
        isActive: true,
        groupId: '558f6baa',
        groupLabel: 'JGD'
      }
    }

    await generator.create([data], 300, 150)
    const part = await generator.nextPart()
    expect(part).toBeDefined()
  })
})
