import {CryptoData, CryptoGetDataResult} from './client/CryptoClient';
import {AVDailyTimeSeries, AVGetDataResult} from './client/AlphaVantageClient';
import _ from 'lodash';
import moment, {Moment} from 'moment';
import {getMomentInEST} from './util';
import {DATE_FORMAT} from './consts';

const AV_TS_DAILY = 'Time Series (Daily)';
const AV_ADJ_CLOSE_PRICE = '5. adjusted close';

export interface Price {
  timestamp: number;
  price: number;
}

export interface PriceTimeSeriesData {
  dimensions: string[];
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
          price: d.close,
          timestamp: d.time * 1000,
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
    let startDate = getMomentInEST(endDate)
      .subtract(lookBackDays, 'day')
      .format(DATE_FORMAT);
    dates = dates.sort();

    console.log('StartDate : ' + startDate + ', endDate: ' + endDateStr);
    const startIndex = dates.findIndex(e => e >= startDate);
    const endIndex = dates.findIndex(e => e > endDateStr);
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
        price: parseFloat(rawData[d][AV_ADJ_CLOSE_PRICE]),
      };
      stockPrices.push(stockPrice);
    });

    return <PriceTimeSeriesData>{
      dimensions: ['Time', AV_ADJ_CLOSE_PRICE],
      prices: stockPrices,
    };
  }
}
