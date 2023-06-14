import {
  IsolatedModuleManifest,
  IsolatedModuleMetadata,
  IsolatedModulePreviewMetadata,
  IsolatedModulesPlugin,
  ISOLATED_MODULES_PLUGIN,
  UIResourceStatus,
  VerifyDynamicModuleResult
} from '@airgap/angular-core'
import { Inject, Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { from, Observable, of } from 'rxjs'
import { first, map, switchMap, tap } from 'rxjs/operators'
import { IsolatedModulesDetailsState } from './isolated-modules-details.types'

const initialState: IsolatedModulesDetailsState = {
  manifest: {
    status: UIResourceStatus.IDLE,
    value: undefined
  },
  path: {
    status: UIResourceStatus.IDLE,
    value: undefined
  },
  isVerified: {
    status: UIResourceStatus.IDLE,
    value: undefined
  }
}

@Injectable()
export class IsolatedModulesDetailsStore extends ComponentStore<IsolatedModulesDetailsState> {
  constructor(@Inject(ISOLATED_MODULES_PLUGIN) private readonly isolatedModules: IsolatedModulesPlugin) {
    super(initialState)
  }

  public readonly loadModuleData = this.effect((metadata$: Observable<IsolatedModuleMetadata>) => {
    return metadata$.pipe(
      switchMap((metadata) =>
        metadata.type === 'preview'
          ? from(this.verifyModule(metadata)).pipe(
              first(),
              map((isVerified: boolean) => ({ manifest: metadata.manifest, isVerified }))
            )
          : of({ manifest: metadata.manifest, isVerified: true })
      ),
      tap({
        next: ({ manifest, isVerified }) => this.setData({ manifest, isVerified }),
        error: () => this.onError()
      })
    )
  })

  private readonly setData = this.updater(
    (state: IsolatedModulesDetailsState, data: { manifest: IsolatedModuleManifest; isVerified: boolean }) => {
      return {
        ...state,
        manifest: {
          status: UIResourceStatus.SUCCESS,
          value: data.manifest
        },
        isVerified: {
          status: UIResourceStatus.SUCCESS,
          value: data.isVerified
        }
      }
    }
  )

  private readonly onError = this.updater((state: IsolatedModulesDetailsState) => {
    return {
      ...state,
      manifest: {
        status: UIResourceStatus.ERROR,
        value: state.manifest.value
      },
      isVerified: {
        status: UIResourceStatus.ERROR,
        value: state.isVerified.value
      }
    }
  })

  private async verifyModule(metadata: IsolatedModulePreviewMetadata): Promise<boolean> {
    const { verified }: VerifyDynamicModuleResult = await this.isolatedModules.verifyDynamicModule({
      path: `${metadata.path}/${metadata.root}`.replace(/\/+$/, ''),
      directory: metadata.directory
    })

    return verified
  }
}
