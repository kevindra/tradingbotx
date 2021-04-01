import {CryptoData, CryptoGetDataResult} from './client/CryptoClient';
import {AVDailyTimeSeries, AVGetDataResult} from './client/AlphaVantageClient';
import _ from 'lodash';
import moment, {Moment} from 'moment';
import {getMomentInEST} from './util';
import {DATE_FORMAT} from './consts';

const AV_TS_DAILY = 'Time Series (Daily)';
const AV_OPEN_PRICE = '1. open';
const AV_HIGH_PRICE = '2. high';
const AV_LOW_PRICE = '3. low';
const AV_CLOSE_PRICE = '4. close';
const AV_ADJ_CLOSE_PRICE = '5. adjusted close';
const AV_VOLUME = '6. volume';
const AV_DIVIDEND_AMOUNT = '7. dividend amount';
const AV_ADJ_SPLIT_COEFFICIENT = '8. split coefficient';

export interface Price {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClosePrice: number; // Split adjusted
  volume: number;
  dividendAmount: number;
  splitCoefficient: number;
}

export interface PriceTimeSeriesData {
  dimensions?: string[];
  prices: Price[];
}

export class SecurityTimeseriesAdapter {
  constructor() {}

  adaptCrypto(
    cryptoData: CryptoGetDataResult,
    endDate: Moment,
    lookBackDays: number,
    filter: string[] = ['time', 'close']
  ): PriceTimeSeriesData {
    const rawData: CryptoData[] = cryptoData.Data;
    const prices = rawData
      .filter(d => {
        // dates b/w endDate & (endDate - lookBackDays)
        const diff = endDate.diff(moment(d.time * 1000), 'days');
        return diff <= lookBackDays && diff >= 0;
      })
      .map(d => {
        return <Price>{
          open: d.open,
          adjustedClosePrice: d.close,
          close: d.close,
          high: d.high,
          low: d.low,
          volume: d.volumeto - d.volumefrom,
          timestamp: d.time * 1000,
          splitCoefficient: 1.0
        };
      });

    return <PriceTimeSeriesData>{
      dimensions: [...filter],
      prices: prices,
    };
  }

  adaptAlphaVantage(
    avData: AVGetDataResult,
    lookBackDays: number,
    endDate: Moment
  ): PriceTimeSeriesData {
    const rawData: AVDailyTimeSeries = avData[AV_TS_DAILY];
    let dates: string[] = Object.keys(rawData);

    const endDateStr = endDate.format('YYYY-MM-DD');
    let startDate = getMomentInEST(endDate.clone())
      .subtract(lookBackDays, 'day')
      .format(DATE_FORMAT);
    dates = dates.sort();

    console.log(
      'StartDate : ' +
        startDate +
        ', endDate: ' +
        endDateStr +
        ', lookback: ' +
        lookBackDays
    );

    const startIndex = dates.findIndex(e => e >= startDate);
    const endIndex = dates.findIndex(e => e >= endDateStr);
    if (startIndex === -1) {
      throw new Error('No data found in this date range.');
    }
    dates = dates.slice(
      startIndex,
      endIndex == -1 ? dates.length - 1 : endIndex
    );

    const stockPrices: Price[] = [];
    dates.forEach(d => {
      const stockPrice: Price = {
        timestamp: new Date(d).getTime(),
        open: parseFloat(rawData[d][AV_OPEN_PRICE]),
        high: parseFloat(rawData[d][AV_HIGH_PRICE]),
        low: parseFloat(rawData[d][AV_LOW_PRICE]),
        close: parseFloat(rawData[d][AV_CLOSE_PRICE]),
        adjustedClosePrice: parseFloat(rawData[d][AV_ADJ_CLOSE_PRICE]),
        dividendAmount: parseFloat(rawData[d][AV_DIVIDEND_AMOUNT]),
        splitCoefficient: parseFloat(rawData[d][AV_ADJ_SPLIT_COEFFICIENT]),
        volume: parseFloat(rawData[d][AV_VOLUME]),
      };
      stockPrices.push(stockPrice);
    });

    return <PriceTimeSeriesData>{
      dimensions: ['Time', AV_ADJ_CLOSE_PRICE],
      prices: stockPrices,
    };
  }
}
