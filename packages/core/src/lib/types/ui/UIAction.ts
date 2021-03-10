export enum UIActionStatus {
  PENDING = 'pending',
  HANDLED = 'handled'
}

export interface UIAction<T> {
  id: string
  value: T
  status: UIActionStatus
}