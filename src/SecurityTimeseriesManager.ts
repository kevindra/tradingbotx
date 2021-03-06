import {AlphaVantageClient} from './client/AlphaVantageClient';
import {CryptoClient, CryptoGetDataResult} from './client/CryptoClient';
import {
  PriceTimeSeriesData,
  SecurityTimeseriesAdapter,
} from './SecurityTimeseriesAdapter';

let avClient = new AlphaVantageClient();
let cryptoClient = new CryptoClient();
let adapter = new SecurityTimeseriesAdapter();

export class SecurityTimeseriesManager {
  constructor() {}

  async getCryptoTimeseries(
    ticker: string,
    currency: string,
    periodInDays: number
  ): Promise<PriceTimeSeriesData> {
    let cryptoData: CryptoGetDataResult = await cryptoClient.getData({
      ticker: ticker.toUpperCase(),
      currency: currency.toUpperCase(),
      periodInDays: periodInDays,
    });

    return adapter.adaptCrypto(cryptoData);
  }

  async getStockTimeseries(
    ticker: string = 'AMZN',
    periodInDays: number = 365
  ): Promise<PriceTimeSeriesData> {
    let stockData = await avClient.getData(ticker.toUpperCase());
    return adapter.adaptAlphaVantage(stockData, periodInDays);
  }
}

// var stm = new SecurityTimeseries();
// module.exports = stm;
// stm.getCryptoTimeseries('BTC', 'USD').then((d) => console.log(d))
// stm.getStockTimeseries('AMZN').then((d) => console.log(d))
