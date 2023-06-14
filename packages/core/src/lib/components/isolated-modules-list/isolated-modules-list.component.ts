import { Component, EventEmitter, Inject, Injector, Input, OnChanges, Output, SimpleChanges } from '@angular/core'
import { BaseComponent } from '../../base/base.component'
import { IsolatedModuleInstalledMetadata, IsolatedModuleMetadata } from '../../types/isolated-modules/IsolatedModuleMetadata'
import { UIResource, UIResourceStatus } from '../../types/ui/UIResource'
import { isolatedModulesListFacade, IsolatedModulesListFacade, ISOLATED_MODULES_LIST_FACADE } from './isolated-modules-list.facade'

@Component({
  selector: 'airgap-isolated-modules-list',
  templateUrl: './isolated-modules-list.component.html',
  styleUrls: ['./isolated-modules-list.component.scss'],
  providers: [{ provide: ISOLATED_MODULES_LIST_FACADE, useFactory: isolatedModulesListFacade, deps: [Injector] }]
})
export class IsolatedModulesListComponent extends BaseComponent<IsolatedModulesListFacade> implements OnChanges {
  public readonly UIResourceStatus: typeof UIResourceStatus = UIResourceStatus

  @Input()
  public modules: UIResource<IsolatedModuleInstalledMetadata[]>

  @Input()
  public filter: string | undefined

  @Input()
  public theme: 'light' | 'dark' = 'light'

  @Output()
  public onModuleSelected: EventEmitter<IsolatedModuleMetadata> = new EventEmitter()

  constructor(@Inject(ISOLATED_MODULES_LIST_FACADE) facade: IsolatedModulesListFacade) {
    super(facade)
  }

  public ngOnInit() {
    this.facade.updateModules(this.modules, this.filter)

    return super.ngOnInit()
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.modules.previousValue !== changes.modules.currentValue) {
      this.facade.updateModules(changes.modules.currentValue, changes.filter?.currentValue)
    }

    if (changes.filter?.previousValue !== changes.filter?.currentValue) {
      this.facade.filterModules(changes.filter.currentValue)
    }
  }

  public selectModule(module: IsolatedModuleInstalledMetadata): void {
    this.onModuleSelected.emit(module)
  }
}
