export enum UIResourceStatus {
  IDLE = 'idle',
  SUCCESS = 'success',
  ERROR = 'error',
  LOADING = 'loading'
}

export interface UIResource<T> {
  value: T | undefined
  status: UIResourceStatus
}
