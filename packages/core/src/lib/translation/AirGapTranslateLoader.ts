/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClient } from '@angular/common/http'
import { TranslateLoader } from '@ngx-translate/core'
import { forkJoin, Observable, of } from 'rxjs'
import { catchError, map } from 'rxjs/operators'

interface TranslateResource {
  prefix: string
  suffix: string
}

export class AirGapTranslateLoader implements TranslateLoader {
  private readonly translateResources: TranslateResource[]

  constructor(private readonly httpClient: HttpClient, resources: TranslateResource | TranslateResource[]) {
    const externalResources: TranslateResource[] = Array.isArray(resources) ? resources : [resources]
    const commonResources: TranslateResource[] = [
      {
        prefix: './assets/i18n-common/',
        suffix: '.json'
      }
    ]

    this.translateResources = commonResources.concat(externalResources)
  }

  public getTranslation(lang: string): Observable<any> {
    return forkJoin(
      this.translateResources.map((resource: TranslateResource) => {
        const resourcePath = `${resource.prefix}${lang}${resource.suffix}`

        return this.httpClient.get(resourcePath).pipe(
          catchError((error) => {
            // eslint-disable-next-line no-console
            console.warn(`CommonTranslateLoader: could not load translation file ${resourcePath}: ${error}`)

            return of({})
          })
        )
      })
    ).pipe(map((translations: any[]) => translations.reduce((object: any, next: any) => Object.assign(object, next), {})))
  }
}
