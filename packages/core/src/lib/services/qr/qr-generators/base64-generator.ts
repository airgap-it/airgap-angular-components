// import { AccountShareResponse, IACMessageDefinitionObject, IACMessageType } from '@airgap/coinlib-core'
// import { IACQrGenerator } from '../../iac/qr-generator'

// export class Base64Generator implements IACQrGenerator {
//   private counter: number = 0
//   private payload: string[] = []
//   private readonly messageHandlers: {
//     [key in IACMessageType]: ((deserializedSync: IACMessageDefinitionObject[]) => Promise<boolean>) | undefined
//   }
//   constructor() {
//     this.messageHandlers = {
//       [IACMessageType.AccountShareRequest]: undefined,
//       [IACMessageType.AccountShareResponse]: this.handleAccountShare.bind(this),
//       [IACMessageType.TransactionSignRequest]: undefined,
//       [IACMessageType.TransactionSignResponse]: undefined,
//       [IACMessageType.MessageSignRequest]: undefined,
//       [IACMessageType.MessageSignResponse]: undefined
//     }
//   }

//   protected async handleAccountShare(messageDefinitionObject: IACMessageDefinitionObject[]): Promise<boolean> {
//     const element = messageDefinitionObject[0]

//     const x = element.payload as AccountShareResponse
//     this.payload.push(x.publicKey)

//     return true
//   }

//   public async create(data: IACMessageDefinitionObject[], _maxFragmentLength: number, _minFragmentLength: number): Promise<void> {
//     data.forEach((el) => {
//       const handler = this.messageHandlers[el.type]
//       if (handler) {
//         handler([el])
//       } else {
//       }
//     })
//   }

//   public async canHandleMessage(data: IACMessageDefinitionObject[]) {
//     return data.every((el) => {
//       const handler = this.messageHandlers[el.type]
//       if (handler) {
//         return true
//       } else {
//         return false
//       }
//     })
//   }

//   public async nextPart(): Promise<string> {
//     this.counter = this.counter % this.payload.length
//     return this.payload[this.counter++]
//   }
// }
