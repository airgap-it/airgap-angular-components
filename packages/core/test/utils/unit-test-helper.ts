export const newSpy: (name: string, returnValue: any) => jasmine.Spy = (name: string, returnValue: any): jasmine.Spy =>
  jasmine.createSpy(name).and.returnValue(returnValue)
