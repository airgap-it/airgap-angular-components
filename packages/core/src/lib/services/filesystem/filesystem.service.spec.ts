import { TestBed } from '@angular/core/testing';
import { TestBedUtils } from '../../../../test/utils/test-bed'

import { FilesystemService } from './filesystem.service';

describe('FilesystemService', () => {
  let service: FilesystemService;
  let testBedUtils: TestBedUtils

  beforeEach(() => {
    testBedUtils = new TestBedUtils()
    TestBed.configureTestingModule(testBedUtils.moduleDef({}))
    service = TestBed.inject(FilesystemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
