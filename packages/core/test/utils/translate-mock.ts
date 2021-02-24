/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventEmitter } from '@angular/core'
import { Observable, of } from 'rxjs'

interface TranslationObject {
  [key: string]: string
}

export class TranslateMock {
  public onLangChange: EventEmitter<any> = new EventEmitter()
  public onTranslationChange: EventEmitter<any> = new EventEmitter()
  public onDefaultLangChange: EventEmitter<any> = new EventEmitter()

  private readonly data: TranslationObject = {
    source: 'translated'
  }

  public get(keys: string[] | string = []): Observable<TranslationObject> {
    const translated: TranslationObject = {}
    const newKeys = Array.isArray(keys) ? keys : [keys]

    // eslint-disable-next-line no-console
    console.log('translating keys', newKeys)

    newKeys.forEach((key) => {
      translated[key] = this.data[key] ?? key
    })

    return of(translated)
  }
}
