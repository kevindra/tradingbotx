import {Algo, AlgoInput, AlgoOutput, AlgoActionType} from './algo';

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

export class SellHighAlgo implements Algo {
  /*
   * If stock price is significantly up from its previous low,
   * and if that upside happens very fast (ex - 2-3 months and ~40%+ down, the company usually becomes over valued)
   * we should consider selling at that price.
   */
  async run(algoInput: AlgoInput): Promise<AlgoOutput> {
    const events: Event[] = [];
    let n = 1;
    let lastMinPrice = algoInput.prices[0];
    let lastMinPriceIndex = 0;
    let maxAvgGainPerInterval = 0;
    let maxGainIntensity = -1;
    let dipIndexes = [];
    let dipPrices = [];

    // First event for the first price data point
    events.push({
      currentIndex: 0,
      lastMinPriceIndex: lastMinPriceIndex,
      currentPrice: algoInput.prices[0],
      lastMinPrice: lastMinPrice,
      gain: 0,
      gainPercent: 0,
      gainDuration: 0,
      avgGainPerInterval: 0,
      gainIntensity: 0,
      maxAvgGainPerInterval: 0,
      maxGainIntensity: 0,
      normalizedAvgGainPerInterval: 0,
      normalizedGainIntensity: 0,
    });

    while (n < algoInput.prices.length) {
      if (algoInput.prices[n] < algoInput.prices[n - 1]) {
        if (algoInput.prices[n] < lastMinPrice) {
          lastMinPrice = algoInput.prices[n];
          lastMinPriceIndex = n;
        }
        dipIndexes.push(n);
        dipPrices.push(algoInput.prices[n]);
      }
      // else {
      //   lastMinPrice = algoInput.prices[n];
      //   lastMinPriceIndex = n;
      // }
      // console.log('dips: ' + dipIndexes.length);
      let d = 0;
      let bestEvent: Event | undefined = undefined;
      // below, we compare each price with ALL the previous dips.
      // we must define BestEvent regardless of absense of dips
      while (d < dipIndexes.length || bestEvent === undefined) {
        // use lastMinPrice/Index from dipIndexes IF dip is present
        if (dipIndexes.length !== 0) {
          lastMinPrice = dipPrices[d];
          lastMinPriceIndex = dipIndexes[d];
        }

        const gain = algoInput.prices[n] - lastMinPrice;
        const gainPercent = gain / lastMinPrice;
        const gainDuration = n - lastMinPriceIndex;
        const e: Event = {
          currentIndex: n,
          lastMinPriceIndex: lastMinPriceIndex,
          currentPrice: algoInput.prices[n],
          lastMinPrice: lastMinPrice,
          gain: gain,
          gainPercent: gain / lastMinPrice,
          gainDuration: gainDuration,
          avgGainPerInterval:
            gainDuration == 0 ? 0 : gainPercent / gainDuration, // percent
          gainIntensity: gainDuration * gainPercent, // how intense the drop is i.e. how fast and how much, both together will exponentially increase the confidence
        };
        maxAvgGainPerInterval = Math.max(
          e.avgGainPerInterval,
          maxAvgGainPerInterval
        );
        maxGainIntensity = Math.max(e.gainIntensity, maxGainIntensity);
        e.maxAvgGainPerInterval = maxAvgGainPerInterval;
        e.maxGainIntensity = maxGainIntensity;

        if (bestEvent === undefined) bestEvent = e;
        else if (bestEvent.gainIntensity > e.gainIntensity) {
          bestEvent = e;
        }

        if (n < 2) {
          console.log('-------');
          console.log(bestEvent);
          console.log(e);
          console.log('-------');
        }
        d++;
      }
      events.push(bestEvent!);
      n++;
    }

    console.log(
      events.filter((e, i) => {
        if (e === undefined) console.log(i);
        return e === undefined;
      })
    );
    const hist: {[key: number]: number} = {};
    n = 0;
    while (n < events.length) {
      // avgDropPerInterval is going to be the likelihood metric
      const e = events[n];
      e.normalizedAvgGainPerInterval =
        e.avgGainPerInterval / maxAvgGainPerInterval;

      if (e.gainIntensity > maxGainIntensity) {
        console.log('ERROR', e.gainIntensity, maxGainIntensity);
      }
      e.normalizedGainIntensity = 100 * (e.gainIntensity / maxGainIntensity);
      n++;
    }

    return {
      indicators: [events.map(e => e.normalizedGainIntensity || 0)],
    };
  }

  getBestEvent() {}

  actionType(): AlgoActionType {
    return 'sell';
  }

  name(): string {
    return 'Sell High';
  }
}
