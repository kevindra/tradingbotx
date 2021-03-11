import moment, {Moment} from 'moment';
import {AlphaVantageClient} from './client/AlphaVantageClient';
import {CryptoClient, CryptoGetDataResult} from './client/CryptoClient';
import {
  PriceTimeSeriesData,
  SecurityTimeseriesAdapter,
} from './SecurityTimeseriesAdapter';
import {getMomentInEST} from './util';

const avClient = new AlphaVantageClient();
const cryptoClient = new CryptoClient();
const adapter = new SecurityTimeseriesAdapter();

export class SecurityTimeseriesManager {
  constructor() {}

  async getCryptoTimeseries(
    ticker: string,
    currency: string,
    lookBackDays: number,
    endDate: Moment
  ): Promise<PriceTimeSeriesData> {
    const cryptoData: CryptoGetDataResult = await cryptoClient.getData({
      ticker: ticker.toUpperCase(),
      currency: currency.toUpperCase(),
      lookBackDays:
        lookBackDays + getMomentInEST(moment()).diff(endDate, 'days'), // actual lookBackDays = endDate + input lookback days
    });

    return adapter.adaptCrypto(cryptoData, endDate, lookBackDays);
  }

  async getStockTimeseries(
    ticker = 'AMZN',
    lookBackDays: number,
    endDate: Moment
  ): Promise<PriceTimeSeriesData> {
    const stockData = await avClient.getData(ticker.toUpperCase());
    return adapter.adaptAlphaVantage(stockData, lookBackDays, endDate);
  }
}
