import {BuyTheDipAlgo} from './buythedipalgo';

export type AlgoId = 'buy-the-dip' | 'sell-the-peak';

export function getAlgoById(id: AlgoId) {
  switch (id) {
    case 'buy-the-dip':
      return new BuyTheDipAlgo();
  }
  return undefined;
}
