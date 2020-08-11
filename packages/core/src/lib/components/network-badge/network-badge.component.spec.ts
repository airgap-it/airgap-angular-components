import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { NetworkBadgeComponent } from './network-badge.component'

describe('NetworkBadgeComponent', () => {
  let component: NetworkBadgeComponent
  let fixture: ComponentFixture<NetworkBadgeComponent>

  let testBedUtils: TestBedUtils

  beforeEach(async(() => {
    testBedUtils = new TestBedUtils()
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    TestBed.configureTestingModule(
      testBedUtils.moduleDef({
        declarations: []
      })
    ).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkBadgeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
