import { TestBed } from '@angular/core/testing';
import { FilesystemPluginMock } from '../../../../test/utils/plugins-mock'
import { TestBedUtils } from '../../../../test/utils/test-bed'
import { FILESYSTEM_PLUGIN } from '../../capacitor-plugins/injection-tokens'

import { FilesystemService } from './filesystem.service';

describe('FilesystemService', () => {
  let service: FilesystemService;
  let testBedUtils: TestBedUtils

  let filesystemPluginMock: FilesystemPluginMock

  beforeEach(() => {
    testBedUtils = new TestBedUtils()
    filesystemPluginMock = new FilesystemPluginMock()
    TestBed.configureTestingModule(
      testBedUtils.moduleDef({
        providers: [{ provide: FILESYSTEM_PLUGIN, useValue: filesystemPluginMock }]
      })
    );
    service = TestBed.inject(FilesystemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
