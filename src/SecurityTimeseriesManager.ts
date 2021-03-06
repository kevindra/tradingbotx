import {AlphaVantageClient} from './client/AlphaVantageClient';
import {CryptoClient, CryptoGetDataResult} from './client/CryptoClient';
import {
  PriceTimeSeriesData,
  SecurityTimeseriesAdapter,
} from './SecurityTimeseriesAdapter';

const avClient = new AlphaVantageClient();
const cryptoClient = new CryptoClient();
const adapter = new SecurityTimeseriesAdapter();

export class SecurityTimeseriesManager {
  constructor() {}

  async getCryptoTimeseries(
    ticker: string,
    currency: string,
    periodInDays: number
  ): Promise<PriceTimeSeriesData> {
    const cryptoData: CryptoGetDataResult = await cryptoClient.getData({
      ticker: ticker.toUpperCase(),
      currency: currency.toUpperCase(),
      periodInDays: periodInDays,
    });

    return adapter.adaptCrypto(cryptoData);
  }

  async getStockTimeseries(
    ticker = 'AMZN',
    periodInDays = 365
  ): Promise<PriceTimeSeriesData> {
    const stockData = await avClient.getData(ticker.toUpperCase());
    return adapter.adaptAlphaVantage(stockData, periodInDays);
  }
}

// const stm = new SecurityTimeseries();
// module.exports = stm;
// stm.getCryptoTimeseries('BTC', 'USD').then((d) => console.log(d))
// stm.getStockTimeseries('AMZN').then((d) => console.log(d))
