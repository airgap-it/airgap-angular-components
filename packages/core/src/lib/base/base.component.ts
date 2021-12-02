/* eslint-disable spaced-comment */
import { Directive, OnDestroy, OnInit } from '@angular/core'
import { Subject } from 'rxjs'
import { BaseFacade } from './base.facade'

@Directive()
export abstract class BaseComponent<Facade extends BaseFacade> implements OnInit, OnDestroy {
  private static readonly callSuperNgOnInit: unique symbol = Symbol('Expected to call `super.ngOnInit()`')
  private static readonly callSuperNgOnDestroy: unique symbol = Symbol('Expected to call `super.ngOnDestroy()`')

  private _ngDestroyed$: Subject<void> | undefined
  protected get ngDestroyed$(): Subject<void> {
    if (this._ngDestroyed$ === undefined) {
      this._ngDestroyed$ = new Subject()
    }

    return this._ngDestroyed$
  }

  constructor(public readonly facade: Facade) {
    this.facade.onViewCreate()
  }

  /**************** Lifecycle ****************/

  public ngOnInit(): typeof BaseComponent.callSuperNgOnDestroy & never {
    this.facade.onViewInit()

    // force `super.ngOnInit()` in overriden methods
    return undefined as typeof BaseComponent.callSuperNgOnInit & never
  }

  public ngOnDestroy(): typeof BaseComponent.callSuperNgOnDestroy & never {
    this._ngDestroyed$?.next()
    this._ngDestroyed$?.complete()
    this._ngDestroyed$ = undefined

    this.facade.onViewDestroy()

    // force `super.ngOnDestroy()` in overriden methods
    return undefined as typeof BaseComponent.callSuperNgOnDestroy & never
  }
}
