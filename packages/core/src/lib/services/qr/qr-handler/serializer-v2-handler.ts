import { IACMessageDefinitionObject, IACMessageDefinitionObjectV3, Serializer } from '@airgap/coinlib-core'
import { IACHandlerStatus, IACMessageHandler } from '../../iac/message-handler'
import { convertV2ToV3 } from '../../serializer/serializer.service'

export class SerializerV2Handler implements IACMessageHandler<IACMessageDefinitionObjectV3[]> {
  public readonly name: string = 'SerializerV2Handler'
  private readonly serializer: Serializer

  private readonly callback: any = (): void => undefined

  private progress: number = 0
  private parts: Set<string> = new Set<string>()
  private completeDeserialized: IACMessageDefinitionObject[] | undefined

  constructor(callback: any = (): void => undefined) {
    this.serializer = new Serializer()
    this.callback = callback
  }

  public async canHandle(_part: string): Promise<boolean> {
    const part = this.getParsedData(_part)
    try {
      await this.serializer.deserialize([part])
      return true
    } catch (error) {
      try {
        await this.serializer.deserialize(part.split(','))
        return true
      } catch (error) {
        if (error.availablePages && error.totalPages) {
          return true
        } else {
          return false
        }
      }
    }
  }

  public getParsedData(data: string): string {
    if (!data.includes('://')) {
      return data
    }
    let parsedData: string | null = data
    try {
      const url = new URL(data)
      parsedData = url.searchParams.get('d')
    } catch (e) {}

    return parsedData ?? ''
  }

  public async receive(data: string): Promise<IACHandlerStatus> {
    const parsedData = await this.getParsedData(data)
    if (!parsedData) {
      return IACHandlerStatus.UNSUPPORTED
    }

    // Handle multiple parts
    const splits = parsedData.split(',')
    if (splits.length > 1) {
      for (const split of splits) {
        if (this.parts.has(split)) {
          return IACHandlerStatus.PARTIAL
        }

        const valid = await this.canHandle(split)

        if (valid) {
          this.parts.add(split)
        } else {
          return IACHandlerStatus.UNSUPPORTED
        }
      }
      // End multiple parts
    } else {
      const canHandle = await this.canHandle(parsedData)
      if (!canHandle) {
        return IACHandlerStatus.UNSUPPORTED
      }
      this.parts.add(parsedData)
    }

    try {
      const deserialized = await this.serializer.deserialize(Array.from(this.parts))
      if (deserialized) {
        this.completeDeserialized = deserialized
        return IACHandlerStatus.SUCCESS
      }
    } catch (error) {
      if (error.availablePages && error.totalPages) {
        this.progress = error.availablePages.length / error.totalPages
      }
    }
    return IACHandlerStatus.PARTIAL
  }

  public async getProgress(): Promise<number> {
    return Number(this.progress.toFixed(2))
  }

  public async handleComplete(): Promise<IACMessageDefinitionObjectV3[]> {
    const result = await this.getResult()
    if (!result) {
      throw new Error('Data not complete!')
    }
    this.callback(result)

    return result
  }

  public async getDataSingle(): Promise<IACMessageDefinitionObjectV3[] | undefined> {
    return this.getResult()
  }

  public async getResult(): Promise<IACMessageDefinitionObjectV3[] | undefined> {
    return this.completeDeserialized ? convertV2ToV3(this.completeDeserialized) : undefined
  }

  public async reset(): Promise<void> {
    this.parts = new Set()
    this.progress = 0
    this.completeDeserialized = undefined
    return
  }
}
