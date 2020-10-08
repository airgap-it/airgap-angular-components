export class AlertControllerMock {
  public create: jasmine.Spy = jasmine.createSpy('create').and.returnValue(
    Promise.resolve({
      present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
      onDidDismiss: jasmine.createSpy('onDidDismiss').and.returnValue(Promise.resolve())
    })
  )
  public dismiss: jasmine.Spy = jasmine.createSpy('dismiss').and.returnValue(Promise.resolve())
}

export class LoadingControllerMock {
  public create: jasmine.Spy = jasmine.createSpy('create').and.returnValue(
    Promise.resolve({
      present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
      onDidDismiss: jasmine.createSpy('dismiss').and.returnValue(Promise.resolve())
    })
  )
}

export class ToastControllerMock {
  public create: jasmine.Spy = jasmine.createSpy('create').and.returnValue(
    Promise.resolve({
      present: jasmine.createSpy('present').and.returnValue(Promise.resolve()),
      onDidDismiss: jasmine.createSpy('dismiss').and.returnValue(Promise.resolve())
    })
  )
}
