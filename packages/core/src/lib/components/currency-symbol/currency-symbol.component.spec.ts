import { ProtocolSymbols } from '@airgap/coinlib-core'
import { Injector } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { BehaviorSubject, Observable } from 'rxjs'
import { FilesystemPluginMock } from '../../../../test/utils/plugins-mock'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { AirGapAngularCoreModule } from '../../airgap-angular-core.module'
import { BaseFacade } from '../../base/base.facade'
import { FILESYSTEM_PLUGIN } from '../../capacitor-plugins/injection-tokens'
import { CurrencySymbolComponent } from './currency-symbol.component'
import { CurrencySymbolFacade, ICurrencySymbolFacade } from './currency-symbol.facade'

class CurrencySymbolTestFacade extends BaseFacade implements ICurrencySymbolFacade {
  public symbolSrc$: Observable<string> = new BehaviorSubject('').asObservable()

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public initWithSymbol(_symbol: string, _protocolIdentifier: ProtocolSymbols): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public onSymbolChanged(_symbol: string, _protocolIdentifier: ProtocolSymbols): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public onError(_symbol: string, _protocolIdentifier: ProtocolSymbols, _src?: string): void {}
}

describe('CurrencySymbolComponent', () => {
  let component: CurrencySymbolComponent
  let fixture: ComponentFixture<CurrencySymbolComponent>

  let testBedUtils: TestBedUtils

  let filesystemPluginMock: FilesystemPluginMock

  beforeEach(
    waitForAsync(async () => {
      AirGapAngularCoreModule.factories = {
        currencySymbolFacade: (_injector: Injector): CurrencySymbolFacade => new CurrencySymbolTestFacade()
      }

      testBedUtils = new TestBedUtils()
      filesystemPluginMock = new FilesystemPluginMock()
      await TestBed.configureTestingModule(
        testBedUtils.moduleDef({
          providers: [{ provide: FILESYSTEM_PLUGIN, useValue: filesystemPluginMock }]
        })
      ).compileComponents()
    })
  )

  beforeEach(() => {
    fixture = TestBed.createComponent(CurrencySymbolComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
