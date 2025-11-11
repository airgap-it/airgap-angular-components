import { MainProtocolSymbols } from '@airgap/coinlib-core'
import { IACMessageDefinitionObjectV3, IACMessageType } from '@airgap/serializer'
import { IACHandlerStatus } from '../../iac/message-handler'
import { SerializerV3Generator } from '../qr-generators/serializer-v3-generator'
import { SerializerV3Handler } from './serializer-v3-handler'

describe('SerializerV3Handler', () => {
  let generator: SerializerV3Generator
  let handler: SerializerV3Handler

  beforeEach(() => {
    generator = new SerializerV3Generator()
    handler = new SerializerV3Handler()
  })

  it('should create', () => {
    expect(handler).toBeTruthy()
  })

  it('should handle a Wallet Sync Request', async () => {
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
        groupLabel: ''
      }
    }

    await generator.create([data], 300, 150)
    const part = await generator.nextPart()

    const handlerStatus: IACHandlerStatus = await handler.receive(part)

    expect(handlerStatus).toBe(IACHandlerStatus.SUCCESS)
  })

  it('should handle a Wallet Sync Request (v3, single)', async () => {
    const str: string =
      'ur:bytes/hdioctluayaeaeaeaeaeaeaxjeidjtjzihiegapldeptmoidtadpkkolrydyhgurssdkfxurtiuospeyfxuraelrhhnlfwzoqdhgdakgrhrkkezcaohsfldeeygtehetqzolzmoylsgttowykthfeoentorlrluekgiadmhpvevatskkmnjzgrgwfhbybaaaaecpgmdtrohgaeaeaekbheeyhg'

    const handlerStatus: IACHandlerStatus = await handler.receive(str)

    expect(handlerStatus).toBe(IACHandlerStatus.SUCCESS)
  })

  it('should handle a Wallet Sync Request (v3, single, with prefix)', async () => {
    const str: string =
      'airgap-vault://?ur=hdioctluayaeaeaeaeaeaeaxjeidjtjzihiegapldeptmoidtadpkkolrydyhgurssdkfxurtiuospeyfxuraelrhhnlfwzoqdhgdakgrhrkkezcaohsfldeeygtehetqzolzmoylsgttowykthfeoentorlrluekgiadmhpvevatskkmnjzgrgwfhbybaaaaecpgmdtrohgaeaeaekbheeyhg'

    const handlerStatus: IACHandlerStatus = await handler.receive(str)

    expect(handlerStatus).toBe(IACHandlerStatus.SUCCESS)
  })

  it('should handle a Wallet Sync Request (v3, partial, without prefix)', async () => {
    const parts = [
      'ur:bytes/1-6/lpadamcsincykbheeyhggmhdioctluayaeaeaeaeaeaeaxjeidjtjzihiekttivedl',
      'ur:bytes/2-6/lpaoamcsincykbheeyhggmgapldeptmoidtadpkkolrydyhgurssdkfxurtncpghsr',
      'ur:bytes/3-6/lpaxamcsincykbheeyhggmtiuospeyfxuraelrhhnlfwzoqdhgdakgrhrkclgogyyt',
      'ur:bytes/4-6/lpaaamcsincykbheeyhggmkezcaohsfldeeygtehetqzolzmoylsgttowyamhkgwwn',
      'ur:bytes/5-6/lpahamcsincykbheeyhggmkthfeoentorlrluekgiadmhpvevatskkmnjzvoptjlke',
      'ur:bytes/6-6/lpamamcsincykbheeyhggmgrgwfhbybaaaaecpgmdtrohgaeaeaeaeaeaewmluoxmu'
    ].map((part) => part.toUpperCase())

    const expectedStatusArray = [
      IACHandlerStatus.PARTIAL,
      IACHandlerStatus.PARTIAL,
      IACHandlerStatus.PARTIAL,
      IACHandlerStatus.PARTIAL,
      IACHandlerStatus.PARTIAL,
      IACHandlerStatus.SUCCESS
    ]

    for (let i = 0; i < expectedStatusArray.length; i++) {
      const handlerStatus = await handler.receive(parts[i])
      console.log(`Element ${i} progress ${await handler.getProgress()}`)
      expect(handlerStatus).toBe(expectedStatusArray[i], `Element ${i}`)
    }
  })

  it('should handle a Wallet Sync Request (v3, partial, without prefix)2', async () => {
    const str: string =
      'UR:BYTES/6-3/LPAMAXCFAXIACYJKVTFNZOHKADCLUETELOHLGHDSRSZTHYUYRFTNBZHPNDSBCHDINNPRKTVYZOHYFXYTKBKEBAJSOEGOFMCPHKBWBAJOUEJPJTCSURLAVAYNBSOXGSIOFGISTPRSYTKBKGTSPSHHNTPTDNEELOHDUEDMPAMTPRTTMOIMBDPTDLUEPASKGTRSHNTLIADTNYAAFSNLAOPMFRFXRDFSUYCSIEGHDESGPKRFSKPAYKKEHPBBWSJZSGGHAXLRMYTTJOHFDNYALPISHDOECYUTJYCTGLSGHNDRWTFZFYGTMTZTCAUOKNROBDYNSBMOLOREAHTIKBSOROPLTKAEUEGSTOAYFMESGHRODLJPEENBKKSBGOTEIMWTCWCYSFYKTLNNPTFZPMASMOLDRKGTDRGHKSMKRKJOHKYNZTBNWFCTLFWKHLAHENFDVYVSGSWEPYLUKPAMYATBZOFZSNLNBESWWMRHDMKIYAATVOJNMSOSIEIYQDSTGWPRHEENBDLTMWEYETLDBWTKTILUFGBZSFSEDKUODWMOHFFZKSJKDMDPGLTLVTCAOEFWWKURCXNSGOASTPUECYWMDYHTPEROINDSGETIHDMSBY'

    const handlerStatus: IACHandlerStatus = await handler.receive(str)

    expect(handlerStatus).toBe(IACHandlerStatus.PARTIAL)
  })

  it('should handle a Wallet Sync Request (v3, partial, without prefix) and reset if a new one is received', async () => {
    const str: string =
      'UR:BYTES/6-3/LPAMAXCFAXIACYJKVTFNZOHKADCLUETELOHLGHDSRSZTHYUYRFTNBZHPNDSBCHDINNPRKTVYZOHYFXYTKBKEBAJSOEGOFMCPHKBWBAJOUEJPJTCSURLAVAYNBSOXGSIOFGISTPRSYTKBKGTSPSHHNTPTDNEELOHDUEDMPAMTPRTTMOIMBDPTDLUEPASKGTRSHNTLIADTNYAAFSNLAOPMFRFXRDFSUYCSIEGHDESGPKRFSKPAYKKEHPBBWSJZSGGHAXLRMYTTJOHFDNYALPISHDOECYUTJYCTGLSGHNDRWTFZFYGTMTZTCAUOKNROBDYNSBMOLOREAHTIKBSOROPLTKAEUEGSTOAYFMESGHRODLJPEENBKKSBGOTEIMWTCWCYSFYKTLNNPTFZPMASMOLDRKGTDRGHKSMKRKJOHKYNZTBNWFCTLFWKHLAHENFDVYVSGSWEPYLUKPAMYATBZOFZSNLNBESWWMRHDMKIYAATVOJNMSOSIEIYQDSTGWPRHEENBDLTMWEYETLDBWTKTILUFGBZSFSEDKUODWMOHFFZKSJKDMDPGLTLVTCAOEFWWKURCXNSGOASTPUECYWMDYHTPEROINDSGETIHDMSBY'

    const handlerStatus: IACHandlerStatus = await handler.receive(str)

    expect(handlerStatus).toBe(IACHandlerStatus.PARTIAL, 'first')
    console.log(`First progress ${await handler.getProgress()}`)

    const parts = [
      'ur:bytes/1-6/lpadamcsincykbheeyhggmhdioctluayaeaeaeaeaeaeaxjeidjtjzihiekttivedl',
      'ur:bytes/2-6/lpaoamcsincykbheeyhggmgapldeptmoidtadpkkolrydyhgurssdkfxurtncpghsr',
      'ur:bytes/3-6/lpaxamcsincykbheeyhggmtiuospeyfxuraelrhhnlfwzoqdhgdakgrhrkclgogyyt',
      'ur:bytes/4-6/lpaaamcsincykbheeyhggmkezcaohsfldeeygtehetqzolzmoylsgttowyamhkgwwn',
      'ur:bytes/5-6/lpahamcsincykbheeyhggmkthfeoentorlrluekgiadmhpvevatskkmnjzvoptjlke',
      'ur:bytes/6-6/lpamamcsincykbheeyhggmgrgwfhbybaaaaecpgmdtrohgaeaeaeaeaeaewmluoxmu'
    ].map((part) => part.toUpperCase())

    const expectedStatusArray = [
      IACHandlerStatus.PARTIAL,
      IACHandlerStatus.PARTIAL,
      IACHandlerStatus.PARTIAL,
      IACHandlerStatus.PARTIAL,
      IACHandlerStatus.PARTIAL,
      IACHandlerStatus.SUCCESS
    ]

    for (let i = 0; i < expectedStatusArray.length; i++) {
      const handlerStatus = await handler.receive(parts[i])
      console.log(`Element ${i} progress ${await handler.getProgress()}`)
      expect(handlerStatus).toBe(expectedStatusArray[i], `Element ${i}`)
    }
  })

  it('should fail to handle a custom UR, but the result should be available in "getDataSingle()"', async () => {
    const str: string =
      'ur:crypto-output/taadmwtaaddlolaowkaxhdclaokgfyaebgtirdhnrthgpelfpddkfrfrnehycevwdshkoektpyfhtpcpynvdplgondaahdcxnsfxcnndcwjzosfgsfesnnrlaswyykpycetlhhbsfghtvowtcxsbzctyhfaxasvdahtaadehoeadaeaoaeamtaaddyotadlncsghykaeykaeykaocydifhjnoxaxaxaycytbknjtdylkihynwe'

    const handlerStatus: IACHandlerStatus = await handler.receive(str)

    expect(handlerStatus).toBe(IACHandlerStatus.SUCCESS)

    try {
      const result = await handler.getResult()
      throw new Error('Not a valid serializer message' + result)
    } catch (e) {
      const single = await handler.getDataSingle()
      expect(single).toBe(
        'UR:BYTES/OLHSEYWKHSEOHDCLAOKGFYAEBGTIRDHNRTHGPELFPDDKFRFRNEHYCEVWDSHKOEKTPYFHTPCPYNVDPLGONDHSEEHDCXNSFXCNNDCWJZOSFGSFESNNRLASWYYKPYCETLHHBSFGHTVOWTCXSBZCTYHFAXASVDHSECOEHSEHAEHSEYAEHSENOTHSEHLNCSGHYKAEYKAEYKHSEYCYDIFHJNOXHSEOAXHSETCYTBKNJTDYKKCALYFE'
      )
    }
  })

  // it('should handle a BTC transaction', async () => {
  //   const str: string =
  //     'UR:BYTES/HKADEMCTLUAYAEAEAEAEAEAEAXJEIDJTJZIHIEGTGLDRGAMTIDETRYPMPSRHETEHQDDEFSPAFZRLFNEHDIDIRESSGEHEURFMSKRPCPRSOENBEESOSFTADAUOFRCNSPDEFSETDASPOSRTUOSPSFTKEYDLESRHEYSAOEDKEHRTDWESPECPPEDKOETYFSTDTDRONBDEDPETPTSGSKEHRLTDETCPEEOXETEETISPDWTDTKTKAHSPGAEHBKENGTDTAYSGGTDLBDJOLDPKFDGRPYJOGTWZBTBKPFEEPLLOPSFDGEEMDWSBBKECECJYASSBPKWZENIMIMJZPMGDEYWKWTBKDMEMEEBDSGWZASBKPFDEBTJYWFJSTKMNDRBKTODLDMBAYLWNDNJYGTBTYKWZGLENTIEMLOGDIENYPSYNROKEHYKIMTVEHFUEQZWTFHEYEOBNWSKIRHKNENTLOEWMPFGRWZMOSOYLFHFSFNVSSAIETDUERTTYTYMOWTLPCSFXHLHDCSCFCSHTNSHDCSRSAOGONDVWYTDKESVDOLLPLTVWMTNDCHKSESRDLPFRFRNYVDCMRKMKFYMWZOIEIHGOKNLPOSRDDYCFFEGEAOAEDMFGYTCWFYADAEAEREGOCKIO'

  //   const handlerStatus: IACHandlerStatus = await handler.receive(str)

  //   expect(handlerStatus).toBe(IACHandlerStatus.SUCCESS)

  //   const result = await handler.getResult()
  //   expect(result?.result.length).toBe(1)
  // })

  // TODO: To import other accounts. This will be needed for multisig
  // UR TYPES
  // it('should handle a crypto-account ur', async () => {
  //   const parts = [
  //     'ur:crypto-account/oeadcyjladzmspaolytaadmwtaaddlonaxhdclaxbncycpmejnkbrfdtbghplpttwdehrtrdothgfhynyasacwaypelnnlswsgpykngraahdcxrpvtuockctrpoymdlgesrlglksgddarpptecjzjowzadrpdamsdpguhfaxwnmhmoamtaaddyotadlecsghykaeykaeykaewkadwkaocyltkbdkmdaxaxaycyuyjopsvwasieghihjkjyhlbevtae'
  //   ].map((part) => part.toUpperCase())

  //   const expectedStatusArray = [IACHandlerStatus.SUCCESS]

  //   for (let i = 0; i < expectedStatusArray.length; i++) {
  //     const handlerStatus = await handler.receive(parts[i])
  //     console.log(`Element ${i} progress ${await handler.getProgress()}`)
  //     expect(handlerStatus).toBe(expectedStatusArray[i], `Element ${i}`)
  //   }
  //   console.log('result', JSON.stringify(await handler.getResult()))
  // })

  it('should handle a crypto-psbt ur', async () => {
    const parts = [
      'UR:CRYPTO-PSBT/1-2/LPADAOCFADCYCYIHRENLGMHDLGHKADCHJOJKIDJYZMADAEJSAOAEAEAEADFLFWGYGLYTFWMYATASFTPDLOVTTLLSKKJSADLRQZJSBDTKDYMHLUFTFTCNWFTDVYAEAEAEAEAEZMZMZMZMAOVSAXAEAEAEAEAEAECMAEBBSEJNVLRDWKJSFYINJZAHZSBZASCKNEBYGYNEFDNDJLDNAEAEAEAEAEAECMAEBBONTPFTNBTPTASFCKEYPTCAIDWSEYSTLYNTMKLPTOAEAEAEAEAEADADCTESDYAEAEAEAEAEAECMAEBBFSTNAEIOFNDS',
      'UR:CRYPTO-PSBT/2-2/LPAOAOCFADCYCYIHRENLGMHDLGJTMTMTMOCTGHAOADTDVEDMHPEEVDPDDKGLATCPAMAOGSPYMUIAVOGLGEYAZOSPKOFPOLLYRKAHYLDYLUKTWDFDMHPLKSFHZMWPZOIMHYHECSJLADZMSPGHAEAELAAEAEAELAAEAEAELAAEAEAEAEADAEAEAEAEAECPAOAXJYHSDARFPREMMOETTBFWCAGYFTGDOTOYMKINFNDNLRPKSEDSATEMYLFNIMZENNJECSJLADZMSPGHAEAELAAEAEAELAAEAEAELAADAEAEAEADAEAEAEAEPSSPLULD'
    ].map((part) => part.toUpperCase())

    const expectedStatusArray = [IACHandlerStatus.PARTIAL, IACHandlerStatus.SUCCESS]

    for (let i = 0; i < expectedStatusArray.length; i++) {
      const handlerStatus = await handler.receive(parts[i])
      console.log(`Element ${i} progress ${await handler.getProgress()}`)
      expect(handlerStatus).toBe(expectedStatusArray[i], `Element ${i}`)
    }
    console.log('result', JSON.stringify(await handler.getResult()))
  })

  it('should handle a metamask sign request ur', async () => {
    const str: string =
      'ur:eth-sign-request/onadtpdagdndcawmgtfrkigrpmndutdnbtkgfssbjnaohdgryagalalnascsgljpnbaelfdibemwaeaeaeaeaeaeaeaeaeaeaeaeaeaeaeaeaeaeaeaelaoxlbjyihjkjyeyaeaeaeaeaeaeaeaeaeaeaeaeaeaeaeaeaeaeaeaeaeaeaeaeaeaeaehnaehglalalaaxadaaadahtaaddyoeadlecsdwykadykadykaewkadwkaocybgeehfkswdtklffd'

    const handlerStatus: IACHandlerStatus = await handler.receive(str)

    expect(handlerStatus).toBe(IACHandlerStatus.SUCCESS)

    const result = await handler.getResult()
    console.log(JSON.stringify(result))
    expect(result?.result.length).toBe(1)
  })

  it('should handle a metamask sign request ur', async () => {
    const str: string =
      'UR:ETH-SIGN-REQUEST/ONADTPDAGDRPGLCKLENBVYGLPFLEUTFTQZYLLDDLDWAOHDEHAOWSADBZLRGLZMZMRTLPBGRSKKZSDALFGMAYMWGRFLAHIYJYPRSPFXTKGTNDVSLPDEDSWSAOLASNBWLTAXLGKBOXSWLAAELARTAXAAAAADAHTAADDYOEADLECSDWYKCSFNYKAEYKAEWKAEWKAOCYPFIDGTFRLBMELOWT'

    const handlerStatus: IACHandlerStatus = await handler.receive(str)

    expect(handlerStatus).toBe(IACHandlerStatus.SUCCESS)

    const result = await handler.getResult()
    console.log(JSON.stringify(result))
    expect(result?.result.length).toBe(1)
  })

  it('should handle a metamask sign request ur (BSC, legacy tx)', async () => {
    const str: string =
      'UR:ETH-SIGN-REQUEST/ONADTPDAGDSBTELKFWLBGSGSOYREOXMNURLUSEAMHGAOHDDWWMAALPADDRAHWZAELFGMAYMWCLSPSAJSLPFPDPVYTIIAFMJZBENNVYIDFYRTPDFRLTCNLNWZJLSEAEAELAETLALAAXADAACSETAHTAADDYOEADLECSDWYKCSFNYKAEYKAEWKAEWKAOCYWMCPCHCAAMYAJLKP'

    const handlerStatus: IACHandlerStatus = await handler.receive(str)

    expect(handlerStatus).toBe(IACHandlerStatus.SUCCESS)

    const result = await handler.getResult()
    console.log(JSON.stringify(result))
    expect(result?.result.length).toBe(1)
  })

  // TODO: Enable when message signing is supported
  // it('should handle an arbitrary message sign request ur from metamask', async () => {
  //   const str: string =
  //     'UR:ETH-SIGN-REQUEST/ONADTPDAGDSFGSVWLOFHZEFLFLLSRSTDSFIESFDMPAAOGWJNKKCXJYIHJKJYCXJNIHJKJKHSIOIHAXAXAHTAADDYOEADLECSDWYKCSFNYKAEYKAEWKAEWKAOCYPFIDGTFRAMGHGRFLAHIYJYPRSPFXTKGTNDVSLPDEDSWSAOLASNBWUODTWMRL'

  //   const handlerStatus: IACHandlerStatus = await handler.receive(str)

  //   expect(handlerStatus).toBe(IACHandlerStatus.SUCCESS)

  //   const result = await handler.getResult()
  //   console.log(JSON.stringify(result))
  //   expect(result?.result.length).toBe(1)
  // })
})
