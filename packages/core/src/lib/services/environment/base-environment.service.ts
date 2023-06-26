import { RuntimeMode } from '../../types/RuntimeMode'

export abstract class BaseEnvironmentService {
  constructor(public readonly mode: RuntimeMode) {}
}
