/* eslint-disable no-implicit-coercion */
import { ICoinDelegateProtocol, ICoinProtocol, MainProtocolSymbols, SubProtocolSymbols } from '@airgap/coinlib-core'
import { AirGapAnyProtocol } from '@airgap/module-kit'
import { AirGapDelegateProtocol } from '@airgap/module-kit/internal'
import { TezosProtocol } from '@airgap/tezos'

export function supportsV0Delegation(protocol: ICoinProtocol): protocol is ICoinDelegateProtocol {
  const delegateProtocol = protocol as ICoinDelegateProtocol

  // temporary until Tezos subprotocols stop inherit TezosProtocol and implement ICoinDelegateProtocol
  const supportingTezosProtocols: string[] = [MainProtocolSymbols.XTZ, SubProtocolSymbols.XTZ_KT]
  if (delegateProtocol instanceof TezosProtocol && !supportingTezosProtocols.includes(delegateProtocol.identifier)) {
    return false
  }

  return (
    !!delegateProtocol.getDefaultDelegatee &&
    !!delegateProtocol.getCurrentDelegateesForPublicKey &&
    !!delegateProtocol.getCurrentDelegateesForAddress &&
    !!delegateProtocol.getDelegateeDetails &&
    !!delegateProtocol.isPublicKeyDelegating &&
    !!delegateProtocol.isAddressDelegating &&
    !!delegateProtocol.getDelegationDetailsFromPublicKey &&
    !!delegateProtocol.getDelegationDetailsFromAddress &&
    !!delegateProtocol.prepareDelegatorActionFromPublicKey
  )
}

export function supportsV1Delegation(protocol: AirGapAnyProtocol): protocol is AirGapAnyProtocol & AirGapDelegateProtocol {
  const delegateProtocol = protocol as AirGapAnyProtocol & AirGapDelegateProtocol

  return (
    !!delegateProtocol.getDefaultDelegatee &&
    !!delegateProtocol.getCurrentDelegateesForPublicKey &&
    !!delegateProtocol.getCurrentDelegateesForAddress &&
    !!delegateProtocol.getDelegateeDetails &&
    !!delegateProtocol.isPublicKeyDelegating &&
    !!delegateProtocol.isAddressDelegating &&
    !!delegateProtocol.getDelegationDetailsFromPublicKey &&
    !!delegateProtocol.getDelegationDetailsFromAddress &&
    !!delegateProtocol.prepareDelegatorActionFromPublicKey
  )
}
