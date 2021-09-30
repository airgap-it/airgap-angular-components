import { IACHandlerStatus } from '../../iac/message-handler'
import { BCURTypesHandler } from './bc-ur-handler'

describe('BCURTypesHandler', () => {
  let handler: BCURTypesHandler

  beforeEach(() => {
    handler = new BCURTypesHandler()
  })

  it('should create', () => {
    expect(handler).toBeTruthy()
  })

  it('should handle a crypto-account ur', async () => {
    const parts = [
      'ur:crypto-account/oeadcyjladzmspaolytaadmwtaaddlonaxhdclaxbncycpmejnkbrfdtbghplpttwdehrtrdothgfhynyasacwaypelnnlswsgpykngraahdcxrpvtuockctrpoymdlgesrlglksgddarpptecjzjowzadrpdamsdpguhfaxwnmhmoamtaaddyotadlecsghykaeykaeykaewkadwkaocyltkbdkmdaxaxaycyuyjopsvwasieghihjkjyhlbevtae'
    ].map((part) => part.toUpperCase())

    const expectedStatusArray = [IACHandlerStatus.SUCCESS]

    for (let i = 0; i < expectedStatusArray.length; i++) {
      const handlerStatus = await handler.receive(parts[i])
      console.log(`Element ${i} progress ${await handler.getProgress()}`)
      expect(handlerStatus).toBe(expectedStatusArray[i], `Element ${i}`)
    }
    console.log('result', JSON.stringify(await handler.getResult()))
  })

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
})
