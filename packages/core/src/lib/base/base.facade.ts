/* eslint-disable spaced-comment */
import { Subject } from 'rxjs'

export abstract class BaseFacade {
  private static readonly callSuperOnViewCreate: unique symbol = Symbol('Expected to call `super.onViewCreate()`')
  private static readonly callSuperOnViewInit: unique symbol = Symbol('Expected to call `super.onViewInit()`')
  private static readonly callSuperOnViewDestroy: unique symbol = Symbol('Expected to call `super.onViewDestroy()`')

  private _viewDestroyed$: Subject<void>
  protected get viewDestroyed$(): Subject<void> {
    if (this._viewDestroyed$ === undefined) {
      this._viewDestroyed$ = new Subject()
    }

    return this._viewDestroyed$
  }

  /**************** Lifecycle ****************/

  public onViewCreate(): typeof BaseFacade.callSuperOnViewCreate & never {
    // force `super.onViewCreate()` in overriden methods
    return undefined as typeof BaseFacade.callSuperOnViewCreate & never
  }

  public onViewInit(): typeof BaseFacade.callSuperOnViewInit & never {
    // force `super.onViewInit()` in overriden methods
    return undefined as typeof BaseFacade.callSuperOnViewInit & never
  }

  public onViewDestroy(): typeof BaseFacade.callSuperOnViewDestroy & never {
    this._viewDestroyed$?.next()
    this._viewDestroyed$?.complete()
    this._viewDestroyed$ = undefined

    // force `super.onViewDestroy()` in overriden methods
    return undefined as typeof BaseFacade.callSuperOnViewDestroy & never
  }
}
