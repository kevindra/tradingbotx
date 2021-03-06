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
    let eventsOfInterest = [];
    let events: Event[] = [];
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

      let drop = lastMaxPrice - algoInput.prices[n];
      let dropPercent = drop / lastMaxPrice;
      let dropDuration = n - lastMaxPriceIndex;
      let e: Event = {
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

    var hist: {[key: number]: number} = {};
    n = 0;
    while (n < events.length) {
      // avgDropPerInterval is going to be the likelihood metric
      var e = events[n];
      e.normalizedAvgDropPerInterval =
        e.avgDropPerInterval / maxAvgDropPerInterval;

      if (e.dropIntensity > maxDropIntensity) {
        console.log('ERROR', e.dropIntensity, maxDropIntensity);
      }
      e.normalizedDropIntensity = 100 * (e.dropIntensity / maxDropIntensity); // TODO, not being used in the histogram yet.

      // var bucket = Math.round(e.normalizedAvgDropPerInterval * 100);
      // if (hist[bucket] === undefined) {
      //   hist[bucket] = 1;
      // } else {
      //   hist[bucket] += 1;
      // }
      n++;
    }

    // n = 0;
    // while (n < events.length) {
    //   var e = events[n];
    //   var bucket = Math.round(e.normalizedAvgDropPerInterval! * 100);
    //   e.confidence = hist[bucket] / events.length;
    //   eventsOfInterest.push(e);
    //   n++;
    // }
    return events;
  }
}

// module.exports = new BuyPredictor();
// var StockPriceData = require('../manager/StockPriceData');
// var spd = new StockPriceData(require('../data/timeseries/AMZN.json'));

// var bp = new BuyPredictor();
// var buySignals = bp.predict(spd.dailyClose());
// console.log(buySignals);
