import { Component, EventEmitter, Inject, Injector, Input, OnChanges, Output, SimpleChanges } from '@angular/core'
import { takeUntil } from 'rxjs/operators'
import { BaseComponent } from '../../base/base.component'
import { IsolatedModuleMetadata } from '../../types/isolated-modules/IsolatedModuleMetadata'
import { UIResource, UIResourceStatus } from '../../types/ui/UIResource'
import {
  IsolatedModulesDetailsFacade,
  isolatedModulesDetailsFacade,
  ISOLATED_MODULES_DETAILS_FACADE
} from './isolated-modules-details.facade'

@Component({
  selector: 'airgap-isolated-modules-details',
  templateUrl: './isolated-modules-details.component.html',
  styleUrls: ['./isolated-modules-details.component.scss'],
  providers: [{ provide: ISOLATED_MODULES_DETAILS_FACADE, useFactory: isolatedModulesDetailsFacade, deps: [Injector] }]
})
export class IsolatedModulesDetailsComponent extends BaseComponent<IsolatedModulesDetailsFacade> implements OnChanges {
  public readonly UIResourceStatus: typeof UIResourceStatus = UIResourceStatus

  @Input()
  public metadata: IsolatedModuleMetadata | undefined

  @Output()
  public isVerified: EventEmitter<boolean> = new EventEmitter()

  constructor(@Inject(ISOLATED_MODULES_DETAILS_FACADE) facade: IsolatedModulesDetailsFacade) {
    super(facade)

    facade.isVerified$.pipe(takeUntil(this.ngDestroyed$)).subscribe((isVerified: UIResource<boolean>) => {
      this.isVerified.emit(isVerified.value ?? false)
    })
  }

  public ngOnInit() {
    this.facade.initWithData(this.metadata)

    return super.ngOnInit()
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.metadata.previousValue !== changes.metadata.currentValue) {
      this.facade.onDataChanged(changes.metadata.currentValue)
    }
  }
}
