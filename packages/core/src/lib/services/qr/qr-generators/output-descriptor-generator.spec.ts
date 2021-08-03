import { IACMessageDefinitionObjectV3, MainProtocolSymbols } from '@airgap/coinlib-core'
import { OutputDescriptorGenerator } from './output-descriptor-generator'

describe('OutputDescriptorGenerator', () => {
  let generator: OutputDescriptorGenerator

  beforeEach(() => {
    generator = new OutputDescriptorGenerator()
  })

  it('should create', () => {
    expect(generator).toBeTruthy()
  })

  it('should generate an account share message', async () => {
    const data: IACMessageDefinitionObjectV3 = {
      id: 79370700,
      protocol: MainProtocolSymbols.BTC_SEGWIT,
      type: 4,
      payload: {
        publicKey: 'zpub6s1D4v39zP2hNjAtAFRZ7J59W8tK9txcqgSM1STVQHq2AyUoM3eyXqCfXbweMCT5c69EQCz4rMgZQeMyKWfCvfeQVLCGQeCsGVdWkmQ3D4F',
        isExtendedPublicKey: true,
        derivationPath: "m/84'/0'/0'/0/1",
        masterFingerprint: '6f01ffc8',
        isActive: true,
        groupId: '6f01ffc8',
        groupLabel: 'Test'
      }
    }

    await generator.create([data], 300, 150)
    const part = await generator.nextPart()
    console.log('part', part)
    expect(part).toBe(
      "wpkh([6f01ffc8/84'/0'/0']zpub6s1D4v39zP2hNjAtAFRZ7J59W8tK9txcqgSM1STVQHq2AyUoM3eyXqCfXbweMCT5c69EQCz4rMgZQeMyKWfCvfeQVLCGQeCsGVdWkmQ3D4F/0/*)"
    )
  })
})
