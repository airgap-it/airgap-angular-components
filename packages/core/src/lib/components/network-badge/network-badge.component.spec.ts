import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { TestBedUtils } from '../../../../test/utils/test-bed'
import { NetworkBadgeComponent } from './network-badge.component'

describe('NetworkBadgeComponent', () => {
  let component: NetworkBadgeComponent
  let fixture: ComponentFixture<NetworkBadgeComponent>

  let testBedUtils: TestBedUtils

  beforeEach(
    waitForAsync(async () => {
      testBedUtils = new TestBedUtils()
      await TestBed.configureTestingModule(testBedUtils.moduleDef({})).compileComponents()
    })
  )

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkBadgeComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
