import {BuyLowAlgo} from './buylowalgo';
import {SellHighAlgo} from './sellhighalgo';
export type AlgoId = 'buy-low' | 'sell-high';

export function getAlgoById(id: AlgoId) {
  switch (id) {
    case 'buy-low':
      return new BuyLowAlgo();
    case 'sell-high':
      return new SellHighAlgo();
  }
}
