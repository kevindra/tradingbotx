import {CryptoData, CryptoGetDataResult} from './client/CryptoClient';
import {AVDailyTimeSeries, AVGetDataResult} from './client/AlphaVantageClient';
import moment from 'moment';
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
    var rawData: CryptoData[] = cryptoData.Data;

    var prices = rawData.map(d => {
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
    var rawData: AVDailyTimeSeries = avData[AV_TS_DAILY];
    var dates: string[] = Object.keys(rawData);
    var startDate = moment()
      .subtract(periodInDays, 'days')
      .format('YYYY-MM-DD');

    dates = _.reverse(dates);
    console.log('Start date : ', startDate, ', filter: ', AV_ADJ_CLOSE_PRICE);
    var startIndex = dates.findIndex(e => e >= startDate);
    if (startIndex == -1) {
      throw new Error('Enter a valid periodInDays');
    }
    dates = dates.slice(startIndex);

    var stockPrices: Price[] = [];
    dates.forEach(d => {
      let stockPrice: Price = {
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

// var fs = require('fs')
// var data = fs.readFileSync('./data/timeseries/AMZN.json', 'utf-8')
// data = JSON.parse(data)

// var sta = new SecurityTimeseriesAdapter();
// sta.adaptCrypto(data)
// console.log(sta.adaptAlphaVantage(data))
// module.exports = sta;
