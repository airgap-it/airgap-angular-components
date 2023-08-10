import { BaseEnvironmentService } from '../../src/lib/services/environment/base-environment.service'
import { RuntimeMode } from '../../src/lib/types/RuntimeMode'

export class MockEnvironmentService extends BaseEnvironmentService {
  constructor() {
    super(RuntimeMode.ONLINE)
  }
}
