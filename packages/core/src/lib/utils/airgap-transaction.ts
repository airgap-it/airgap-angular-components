import { IAirGapTransaction } from '@airgap/coinlib-core'
import BigNumber from 'bignumber.js'

import { flattened } from './array'

export function flattenAirGapTxAddresses(airGapTxs: IAirGapTransaction[], field: keyof Pick<IAirGapTransaction, 'from' | 'to'>): string[] {
  return flattened(airGapTxs.map((tx: IAirGapTransaction) => tx[field]))
}

export function sumAirGapTxValues(airGapTxs: IAirGapTransaction[], field: keyof Pick<IAirGapTransaction, 'amount' | 'fee'>): string {
  return airGapTxs
    .reduce((sum: BigNumber, next: IAirGapTransaction) => {
      let nextValue: BigNumber = new BigNumber(next[field])
      if (nextValue.isNaN()) {
        nextValue = new BigNumber(0)
      }

      return sum.plus(nextValue)
    }, new BigNumber(0))
    .toFixed()
}