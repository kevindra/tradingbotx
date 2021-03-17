import {Algo, AlgoInput, AlgoOutput, AlgoActionType} from './algo';
import {BuyLowAlgo} from './buylowalgo';

export interface Event {
  currentIndex: number;
  currentPrice: number;
  lastMinPriceIndex: number;
  lastMinPrice: number;
  gain: number;
  gainPercent: number;
  gainDuration: number;
  avgGainPerInterval: number;
  gainIntensity: number;
  normalizedGainIntensity?: number;
  normalizedAvgGainPerInterval?: number;
  maxAvgGainPerInterval?: number;
  maxGainIntensity?: number;
}

/**
 * This algo is just the reverse of the BuyLow algorithm.
 */
export class SellHighAlgo implements Algo {
  /*
   * If stock price is significantly up from its previous low,
   * and if that upside happens very fast (ex - 2-3 months and ~40%+ down, the company usually becomes over valued)
   * we should consider selling at that price.
   */
  async run(algoInput: AlgoInput): Promise<AlgoOutput> {
    const b = new BuyLowAlgo();
    const output = await b.run(algoInput);
    output.indicators[0] = output.indicators[0].map(i => 100 - i);
    output.indicators[1] = output.indicators[1].map(i => 100 - i);
    return output;
  }

  actionType(): AlgoActionType {
    return 'sell';
  }

  name(): string {
    return 'Sell High';
  }

  id(): string {
    return 'SellHigh';
  }
}
