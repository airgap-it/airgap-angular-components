import { MainProtocolSymbols } from '@airgap/coinlib-core'
import { IACMessageDefinitionObjectV3, IACMessageType } from '@airgap/serializer'
import { SerializerV3Generator } from './serializer-v3-generator'

describe('SerializerV3Generator', () => {
  let generator: SerializerV3Generator

  beforeEach(() => {
    generator = new SerializerV3Generator()
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
    expect(part).toBe(
      'UR:BYTES/HDIOCTLUAYAEAEAEAEAEAEAXJEIDJTJZIHIEGAPLDEPTMOIDTADPKKOLRYDYHGURSSDKFXURTIUOSPEYFXURAELRHHNLFWZOQDHGDAKGRHRKKEZCAOHSFLDEEYGTEHETQZOLZMOYLSGTTOWYKTHFEOENTORLRLUEKGIADMHPVEVATSKKMNJZGRGWFHBYBAAAAECPGMDTROHGAEAEAEKBHEEYHG'
    )
  })

  it('should generate a prefixed QR string from IACMessageDefinitionObjectV3', async () => {
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
    const single = await generator.getSingle('airgap-vault')
    expect(single).toBe(
      'airgap-vault://?ur=HDIOCTLUAYAEAEAEAEAEAEAXJEIDJTJZIHIEGAPLDEPTMOIDTADPKKOLRYDYHGURSSDKFXURTIUOSPEYFXURAELRHHNLFWZOQDHGDAKGRHRKKEZCAOHSFLDEEYGTEHETQZOLZMOYLSGTTOWYKTHFEOENTORLRLUEKGIADMHPVEVATSKKMNJZGRGWFHBYBAAAAECPGMDTROHGAEAEAEKBHEEYHG'
    )
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

    await generator.create([data], 20, 10)

    const part1 = await generator.nextPart()
    const part2 = await generator.nextPart()
    const part3 = await generator.nextPart()
    const part4 = await generator.nextPart()
    const part5 = await generator.nextPart()
    const part6 = await generator.nextPart()

    console.log('part1', part1)
    console.log('part2', part2)
    console.log('part3', part3)
    console.log('part4', part4)
    console.log('part5', part5)
    console.log('part6', part6)

    expect(part1).toBe('UR:BYTES/1-6/LPADAMCSINCYKBHEEYHGGMHDIOCTLUAYAEAEAEAEAEAEAXJEIDJTJZIHIEKTTIVEDL')
    expect(part2).toBe('UR:BYTES/2-6/LPAOAMCSINCYKBHEEYHGGMGAPLDEPTMOIDTADPKKOLRYDYHGURSSDKFXURTNCPGHSR')
    expect(part3).toBe('UR:BYTES/3-6/LPAXAMCSINCYKBHEEYHGGMTIUOSPEYFXURAELRHHNLFWZOQDHGDAKGRHRKCLGOGYYT')
    expect(part4).toBe('UR:BYTES/4-6/LPAAAMCSINCYKBHEEYHGGMKEZCAOHSFLDEEYGTEHETQZOLZMOYLSGTTOWYAMHKGWWN')
    expect(part5).toBe('UR:BYTES/5-6/LPAHAMCSINCYKBHEEYHGGMKTHFEOENTORLRLUEKGIADMHPVEVATSKKMNJZVOPTJLKE')
    expect(part6).toBe('UR:BYTES/6-6/LPAMAMCSINCYKBHEEYHGGMGRGWFHBYBAAAAECPGMDTROHGAEAEAEAEAEAEWMLUOXMU')
  })
})
