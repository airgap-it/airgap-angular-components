import { async, ComponentFixture, TestBed } from '@angular/core/testing'

import { NgRxComponent } from './ng-rx.component'

describe('NgRxComponent', () => {
  let component: NgRxComponent
  let fixture: ComponentFixture<NgRxComponent>

  beforeEach(async(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    TestBed.configureTestingModule({
      declarations: [NgRxComponent]
    }).compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(NgRxComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
