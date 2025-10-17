import { IACMessageDefinitionObjectV3, IACMessageType } from '@airgap/serializer'
import { BaseIACService, RelayMessage } from './base.iac.service'
import { IACHandlerStatus, IACMessageTransport } from './message-handler'

class TestIACService extends BaseIACService {
  constructor() {
    super({} as any, {} as any, Promise.resolve(), [], {} as any, {} as any, {} as any)

    this.serializerMessageHandlers[IACMessageType.AccountShareRequest] = this.defaultHandler.bind(this)
    this.serializerMessageHandlers[IACMessageType.AccountShareResponse] = this.defaultHandler.bind(this)
    this.serializerMessageHandlers[IACMessageType.TransactionSignRequest] = this.defaultHandler.bind(this)
    this.serializerMessageHandlers[IACMessageType.TransactionSignResponse] = this.defaultHandler.bind(this)
    this.serializerMessageHandlers[IACMessageType.MessageSignRequest] = this.defaultHandler.bind(this)
    this.serializerMessageHandlers[IACMessageType.MessageSignResponse] = this.defaultHandler.bind(this)
  }

  public async relay(data: RelayMessage): Promise<void> {
    console.log('RELAY', data)
  }

  private async defaultHandler(messageDefinitionObjects: IACMessageDefinitionObjectV3[]): Promise<boolean> {
    console.log('DEFAULT HANDLER', messageDefinitionObjects)

    return true
  }
}

describe('BaseIACService', () => {
  let service: BaseIACService

  beforeEach(() => {
    service = new TestIACService()
  })

  it('should create', () => {
    expect(service).toBeTruthy()
  })

  it('should read a BTC unsigned tx', async () => {
    const status = await service.handleRequest(
      'UR:BYTES/HKADEMCTLUAYAEAEAEAEAEAEAXJEIDJTJZIHIEGTGLDRGAMTIDETRYPMPSRHETEHQDDEFSPAFZRLFNEHDIDIRESSGEHEURFMSKRPCPRSOENBEESOSFTADAUOFRCNSPDEFSETDASPOSRTUOSPSFTKEYDLESRHEYSAOEDKEHRTDWESPECPPEDKOETYFSTDTDRONBDEDPETPTSGSKEHRLTDETCPEEOXETEETISPDWTDTKTKAHSPGAEHBKENGTDTAYSGGTDLBDJOLDPKFDGRPYJOGTWZBTBKPFEEPLLOPSFDGEEMDWSBBKECECJYASSBPKWZENIMIMJZPMGDEYWKWTBKDMEMEEBDSGWZASBKPFDEBTJYWFJSTKMNDRBKTODLDMBAYLWNDNJYGTBTYKWZGLENTIEMLOGDIENYPSYNROKEHYKIMTVEHFUEQZWTFHEYEOBNWSKIRHKNENTLOEWMPFGRWZMOSOYLFHFSFNVSSAIETDUERTTYTYMOWTLPCSFXHLHDCSCFCSHTNSHDCSRSAOGONDVWYTDKESVDOLLPLTVWMTNDCHKSESRDLPFRFRNYVDCMRKMKFYMWZOIEIHGOKNLPOSRDDYCFFEGEAOAEDMFGYTCWFYADAEAEREGOCKIO',
      IACMessageTransport.PASTE
    )

    expect(status).toBe(IACHandlerStatus.SUCCESS)
  })
})
