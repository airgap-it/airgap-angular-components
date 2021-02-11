import { async, TestBed } from '@angular/core/testing'
import { MainProtocolSymbols } from '@airgap/coinlib-core'
import { TestBedUtils } from '../../../../test/utils/test-bed'

import { SerializerService } from './serializer.service'

describe('SerializerService', () => {
  let service: SerializerService

  let testBedUtils: TestBedUtils

  // 971 bytes
  const message =
    'Gfeetd57BGivmE4Y1G9jcLsE4pRCMy2XoN6h3w6CigN9RrGsnX6rACfqp4ftgjZ6yZ3Vaz9hx9zwpHsj6GkPwFDkLaoJ4nj1hA96t8BBh9UKN9vDTtAm7ujfngmVdCeFhnyFG8zd7jdQnZY2SG2fJ1aCMuP5,Gfeetd57BJPSvRYsRjBkQvd5o6auVhm8mZNRNrUpbTJ5UwvWiCEoJLmXRW5XJ9UYjVn9CdLjmjWtPJjRqnerYY6Pi5Mx7xnVwJEq7sbnLEHzz2buhfrZZDzkpVUsm1naupcYJuQuHn6JuZsG5WgJJnLvHvPW,Gfeetd57BL3y5dmNV1PXUUEKXAnRYHvRNGoPfDHHigqUthSmcddCYLTF6mVL28A7g3U3rEe3FQdvHhmEqsf7sg7QX3Aivk4qHYbmcHqYZKfFbKnKCAvakVUT85kGbY89Waz5j64adwAWWks95hvykRKhZfnG,Gfeetd57BMiVEr5mPwAMJcTUM2QRhCWKxNJCDEeoSN4BQZ1YGGNX4g9p2jzFLLyXZCT61PMWRjUWw2CqqFSMjD96ZWyHpgSvpYeNatEnvzjdVrh5hPZVFifea4SVeUB8ARm5T5qU3w2Em2PhRo5S9iPuR62N,2cervCC4ii72zS5dgwoxvFiHab39pLAELw8VJVnLwKhhUQvucudRYXGjUqNUjPF8gqzJo42sc1GH92W8Tz1yxXWw8a4HQSLCzHB4AjPEFJFdugM7ZyALQVBP1NGwHWh5RhKDozYDBFFrM9i7eDY'
  const chunks = [
    {
      id: 'WjiXqIQDFB',
      type: 8,
      protocol: 'grs' as MainProtocolSymbols,
      payload: {
        message: message,
        publicKey: '444e1f4ab90c304a5ac003d367747aab63815f583ff2330ce159d12c1ecceba1',
        signature: 'edsigti9yVVCfq9DfmtPeYj2T4BpGt9qP26PW2Dz8eUWeE8UwLsCsnQ9G1cmCqaxjwAWkrDbLkHHeVs2C7dZVtw1w4LCyCCoVsy'
      }
    }
  ]

  beforeEach(async(() => {
    testBedUtils = new TestBedUtils()
    TestBed.configureTestingModule(testBedUtils.moduleDef({}))
    service = TestBed.inject(SerializerService)
  }))

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('Determine correct chunk sizes', () => {
    it('should divide into 1 chunk', async () => {
      service.useV2 = true
      service.singleChunkSize = 1000
      service.multiChunkSize = 200
      const serialized = await service.serialize(chunks)
      expect(serialized.length).toBe(1)
    })

    it('should divide into 1 chunk', async () => {
      service.useV2 = true
      service.singleChunkSize = 1000
      service.multiChunkSize = 1200
      const serialized = await service.serialize(chunks)
      expect(serialized.length).toBe(1)
    })

    it('should divide into 2 chunks', async () => {
      service.useV2 = true
      service.singleChunkSize = 800
      service.multiChunkSize = 500
      const serialized = await service.serialize(chunks)
      expect(serialized.length).toBe(2)
    })

    it('should divide into 3 chunks', async () => {
      service.useV2 = true
      service.singleChunkSize = 800
      service.multiChunkSize = 400
      const serialized = await service.serialize(chunks)
      expect(serialized.length).toBe(3)
    })

    it('should divide into 4 chunks', async () => {
      service.useV2 = true
      service.singleChunkSize = 800
      service.multiChunkSize = 250
      const serialized = await service.serialize(chunks)
      expect(serialized.length).toBe(4)
    })

    it('should divide into 5 chunks', async () => {
      service.useV2 = true
      service.singleChunkSize = 500
      service.multiChunkSize = 200
      const serialized = await service.serialize(chunks)
      expect(serialized.length).toBe(5)
    })

    it('should divide into 49 chunks', async () => {
      service.useV2 = true
      service.singleChunkSize = 100
      service.multiChunkSize = 20
      const serialized = await service.serialize(chunks)
      expect(serialized.length).toBe(49)
    })
  })
})
