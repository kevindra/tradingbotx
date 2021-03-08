import _ from 'lodash';
import {SecurityTimeseriesManager} from './SecurityTimeseriesManager';
import {ConfidenceAlgo, Event} from './ConfidenceAlgo';
import {PriceTimeSeriesData} from './SecurityTimeseriesAdapter';

const timeseriesManager = new SecurityTimeseriesManager();
const algo = new ConfidenceAlgo();

export class ConfidenceCalculator {
  constructor() {}

  async stockBuyerConf(ticker: string, horizon: number) {
    const stockData = await timeseriesManager.getStockTimeseries(ticker, horizon);
    const prices = stockData.prices;

    const events: Event[] = algo.predict({
      prices: prices.map(price => price.price),
    });

    const confidences = _.map(events, 'normalizedDropIntensity');
    return prices.map((row, index) => {
      return [row.timestamp, row.price, confidences[index]];
    });
  }

  async cryptoBuyerConf(ticker = 'BTC', currency = 'USD', horizon = 365) {
    const cryptoData: PriceTimeSeriesData = await timeseriesManager.getCryptoTimeseries(
      ticker,
      currency,
      horizon
    );

    const prices = cryptoData.prices;
    const events: Event[] = algo.predict({
      prices: prices.map(price => price.price),
    });

    const confidences = _.map(events, 'normalizedDropIntensity');

    return prices.map((row, index) => {
      return [row.timestamp, row.price, confidences[index]];
    });
  }
}