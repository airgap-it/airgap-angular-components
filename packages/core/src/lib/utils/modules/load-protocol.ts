import { OfflineProtocolConfiguration, OnlineProtocolConfiguration, ProtocolConfiguration } from '@airgap/module-kit'

export function getOfflineProtocolConfiguration(
  configuration: ProtocolConfiguration,
  protocolType?: ProtocolConfiguration['type']
): OfflineProtocolConfiguration | undefined {
  return protocolType === 'offline' || protocolType === 'full' || protocolType === undefined
    ? configuration.type === 'offline'
      ? configuration
      : configuration.type === 'full'
      ? configuration.offline
      : undefined
    : undefined
}

export function getOnlineProtocolConfiguration(
  configuration: ProtocolConfiguration,
  protocolType?: ProtocolConfiguration['type']
): OnlineProtocolConfiguration | undefined {
  return protocolType === 'online' || protocolType === 'full' || protocolType === undefined
    ? configuration.type === 'online'
      ? configuration
      : configuration.type === 'full'
      ? configuration.online
      : undefined
    : undefined
}
