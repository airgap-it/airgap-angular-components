import { implementsInterface } from '@airgap/module-kit'
import { IsolatedModuleMetadata } from '../../types/isolated-modules/IsolatedModuleMetadata'

export function isIsolatedModuleMetadata(object: unknown): object is IsolatedModuleMetadata {
  return implementsInterface<IsolatedModuleMetadata>(object, {
    module: 'required',
    manifest: 'required',
    path: 'required',
    root: 'required',
    directory: 'required'
  })
}
