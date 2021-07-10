// import { IACMessageType, MainProtocolSymbols } from '@airgap/coinlib-core'
// import { Base64Generator } from './base64-generator'

// fdescribe('Base64Generator', () => {
//   let generator: Base64Generator
//   beforeEach(() => {
//     generator = new Base64Generator()
//   })

//   it('should be created', () => {
//     expect(generator).toBeTruthy()
//   })

//   it('should handle permission response', async () => {
//     const canHandle = await generator.canHandleMessage([
//       {
//         id: '12341234',
//         protocol: MainProtocolSymbols.BTC,
//         type: IACMessageType.AccountShareResponse,
//         payload: {
//           publicKey: 'asdf'
//         } as any
//       }
//     ])
//     expect(canHandle).toBeTruthy()
//   })

//   it('should create permission response', async () => {
//     await generator.create(
//       [
//         {
//           id: '12341234',
//           protocol: MainProtocolSymbols.BTC,
//           type: IACMessageType.AccountShareResponse,
//           payload: {
//             publicKey: 'asdf'
//           } as any
//         }
//       ],
//       0,
//       0
//     )
//     expect(await generator.nextPart()).toBe('asdf1')
//     expect(await generator.nextPart()).toBe('asdf2')
//   })

//   it('should not handle permission request', async () => {
//     const canHandle = await generator.canHandleMessage([
//       {
//         id: '12341234',
//         protocol: MainProtocolSymbols.BTC,
//         type: IACMessageType.AccountShareRequest,
//         payload: {
//           publicKey: 'asdf'
//         } as any
//       }
//     ])
//     expect(canHandle).toBeFalse()
//   })
// })
