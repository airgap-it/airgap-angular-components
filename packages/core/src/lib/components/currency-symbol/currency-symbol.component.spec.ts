import { ProtocolSymbols } from '@airgap/coinlib-core'
import { Injector } from '@angular/core'
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'
import { BehaviorSubject, Observable } from 'rxjs'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { AirGapAngularCoreModule } from '../../airgap-angular-core.module'
import { BaseFacade } from '../../base/base.facade'
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

  beforeEach(waitForAsync(async () => {
    AirGapAngularCoreModule.factories = {
      currencySymbolFacade: (_injector: Injector): CurrencySymbolFacade => new CurrencySymbolTestFacade()
    }

    testBedUtils = new TestBedUtils()
    await TestBed.configureTestingModule(testBedUtils.moduleDef({})).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(CurrencySymbolComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
