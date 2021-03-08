import {CryptoData, CryptoGetDataResult} from './client/CryptoClient';
import {AVDailyTimeSeries, AVGetDataResult} from './client/AlphaVantageClient';
import momenttz from 'moment-timezone';
import _ from 'lodash';

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
    filter: string[] = ['time', 'close']
  ): PriceTimeSeriesData {
    const rawData: CryptoData[] = cryptoData.Data;

    const prices = rawData.map(d => {
      return <Price>{
        price: d.close,
        timestamp: d.time,
      };
    });

    return <PriceTimeSeriesData>{
      dimensions: [...filter],
      prices: prices,
    };
  }

  adaptAlphaVantage(
    avData: AVGetDataResult,
    periodInDays: number = 365
  ): PriceTimeSeriesData {
    const rawData: AVDailyTimeSeries = avData[AV_TS_DAILY];
    let dates: string[] = Object.keys(rawData);
    const startDate = momenttz()
      .tz('America/Toronto')
      .subtract(periodInDays, 'days')
      .format('YYYY-MM-DD');

    dates = _.reverse(dates);
    console.log('Start date : ', startDate, ', filter: ', AV_ADJ_CLOSE_PRICE);
    const startIndex = dates.findIndex(e => e >= startDate);
    if (startIndex === -1) {
      throw new Error('Enter a valid periodInDays');
    }
    dates = dates.slice(startIndex);

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

// const fs = require('fs')
// const data = fs.readFileSync('./data/timeseries/AMZN.json', 'utf-8')
// data = JSON.parse(data)

// const sta = new SecurityTimeseriesAdapter();
// sta.adaptCrypto(data)
// console.log(sta.adaptAlphaVantage(data))
// module.exports = sta;
