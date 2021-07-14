import { IACMessageDefinitionObjectV3, MainProtocolSymbols } from '@airgap/coinlib-core'
import { IACHandlerStatus } from '../../iac/message-handler'
import { SerializerV2Generator } from '../qr-generators/serializer-v2-generator'
import { SerializerV2Handler } from './serializer-v2-handler'

describe('SerializerV2Handler', () => {
  let generator: SerializerV2Generator
  let handler: SerializerV2Handler

  beforeEach(() => {
    generator = new SerializerV2Generator()
    handler = new SerializerV2Handler()
  })

  it('should create', () => {
    expect(handler).toBeTruthy()
  })

  it('should handle a Wallet Sync Request', async () => {
    const data: IACMessageDefinitionObjectV3 = {
      id: 79370700,
      protocol: MainProtocolSymbols.XTZ,
      type: 4,
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
    const handlerStatus: IACHandlerStatus = await handler.receive(part)

    expect(handlerStatus).toBe(IACHandlerStatus.SUCCESS)
  })

  it('should handle a Wallet Sync Request (v2, split)', async () => {
    const str: string =
      '5LogPgc9KvrcytkVAj4cqQXiNkSX3bsS,5LogPgcKwnCn5LZGLqyeqYCSHoiXJarC,5LogPgcWZdYw9ZPb4Py2X9gdRAtYnHFr,5LogPgchBUu6Exr44BwhxkN95FeLjTU5,5LogPgcsoLFFLTorSxD8JF98eUA7dzrq,5LogPgd4RBbQRs5A3oZ698QxMKR37wuQ,5LogPgdF32wZXMBV7DmqUfSbcuwvuvS3,5LogPgdRetHid5VFojeyeRUoKbU4KGdx,5LogPgdcGjdsiVvh5B6LCT71iVdYp6gn,5LogPgdntaz2ofay8hLXpVn83x1czQqt,5LogPgs6eq9zAGL9zdeLxT8VwzvCdB4u'

    const handlerStatus: IACHandlerStatus = await handler.receive(str)

    expect(handlerStatus).toBe(IACHandlerStatus.SUCCESS)
  })

  it('should handle a Wallet Sync Request (v2, split, partial)', async () => {
    const str: string = '5LogPgc9KvrcytkVAj4cqQXiNkSX3bsS'

    const handlerStatus: IACHandlerStatus = await handler.receive(str)

    expect(handlerStatus).toBe(IACHandlerStatus.PARTIAL)
  })

  it('should handle a Wallet Sync Request (v2, single)', async () => {
    const str: string =
      'airgap-wallet://?d=6GDUDKbtxw8oJvcGdDxxA2FRrdW93P8pFcMAqWAW2xXe1PDwpTMcsQRyn4MPGS7NGN5yhRkFRFN8sv4ycYzkAzizzZKk1rcFiicxLa5xG8gqywibT3wmADEVMGEQu3TJsmqsXB8gEuxwu8Ugm5R5mTbMjHhq4JD'

    const handlerStatus: IACHandlerStatus = await handler.receive(str)

    expect(handlerStatus).toBe(IACHandlerStatus.SUCCESS)
  })
})
