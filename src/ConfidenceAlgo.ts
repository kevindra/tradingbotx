export interface AlgoInput {
  prices: number[];
}

export interface Event {
  currentIndex: number;
  currentPrice: number;
  lastMaxPriceIndex: number;
  lastMaxPrice: number;
  drop: number;
  dropPercent: number;
  dropDuration: number;
  avgDropPerInterval: number;
  dropIntensity: number;
  normalizedDropIntensity?: number;
  normalizedAvgDropPerInterval?: number;
}

export class ConfidenceAlgo {
  /*
   * If stock price is significantly down from its previous high,
   * and if that downturn happens very fast (2-3 months and ~40%+ down, the company usually becomes under value)
   * we should consider buying at that price.
   */
  predict(
    algoInput: AlgoInput,
    minDropPercent = 0.5,
    maxDropDuration = 60
  ): Event[] {
    const eventsOfInterest = [];
    const events: Event[] = [];
    let n = 1;
    let lastMaxPrice = algoInput.prices[0];
    let lastMaxPriceIndex = 0;
    let maxAvgDropPerInterval = 0;
    let maxDropIntensity = -1;

    while (n < algoInput.prices.length) {
      if (algoInput.prices[n] > algoInput.prices[n - 1]) {
        if (algoInput.prices[n] > lastMaxPrice) {
          lastMaxPrice = algoInput.prices[n];
          lastMaxPriceIndex = n;
        }
      }

      const drop = lastMaxPrice - algoInput.prices[n];
      const dropPercent = drop / lastMaxPrice;
      const dropDuration = n - lastMaxPriceIndex;
      const e: Event = {
        currentIndex: n,
        lastMaxPriceIndex: lastMaxPriceIndex,
        currentPrice: algoInput.prices[n],
        lastMaxPrice: lastMaxPrice,
        drop: drop,
        dropPercent: drop / lastMaxPrice,
        dropDuration: dropDuration,
        avgDropPerInterval: dropDuration == 0 ? 0 : dropPercent / dropDuration, // percent
        dropIntensity: dropDuration * dropPercent, // how intense the drop is i.e. how fast and how much, both together will exponentially increase the confidence
      };
      maxAvgDropPerInterval = Math.max(
        e.avgDropPerInterval,
        maxAvgDropPerInterval
      );
      maxDropIntensity = Math.max(e.dropIntensity, maxDropIntensity);

      events.push(e);
      n++;
    }

    const hist: {[key: number]: number} = {};
    n = 0;
    while (n < events.length) {
      // avgDropPerInterval is going to be the likelihood metric
      const e = events[n];
      e.normalizedAvgDropPerInterval =
        e.avgDropPerInterval / maxAvgDropPerInterval;

      if (e.dropIntensity > maxDropIntensity) {
        console.log('ERROR', e.dropIntensity, maxDropIntensity);
      }
      e.normalizedDropIntensity = 100 * (e.dropIntensity / maxDropIntensity); // TODO, not being used in the histogram yet.

      // const bucket = Math.round(e.normalizedAvgDropPerInterval * 100);
      // if (hist[bucket] === undefined) {
      //   hist[bucket] = 1;
      // } else {
      //   hist[bucket] += 1;
      // }
      n++;
    }

    // n = 0;
    // while (n < events.length) {
    //   const e = events[n];
    //   const bucket = Math.round(e.normalizedAvgDropPerInterval! * 100);
    //   e.confidence = hist[bucket] / events.length;
    //   eventsOfInterest.push(e);
    //   n++;
    // }
    return events;
  }
}

// module.exports = new BuyPredictor();
// const StockPriceData = require('../manager/StockPriceData');
// const spd = new StockPriceData(require('../data/timeseries/AMZN.json'));

// const bp = new BuyPredictor();
// const buySignals = bp.predict(spd.dailyClose());
// console.log(buySignals);
