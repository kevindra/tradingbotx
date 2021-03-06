// var request = require('request');
// var queryString = require('query-string');
import request from 'request';
import queryString from 'query-string';
import {query} from 'express';

export interface GetData {
  symbol: string;
  apikey: string;
  function: string;
  outputsize: string;
}

const URL = 'https://www.alphavantage.co/query?';

export interface AVGetDataResult {
  [key: string]: AVDailyTimeSeries;
}
export interface AVDailyTimeSeries {
  [key: string]: AVDailyPriceData;
}
export interface AVDailyPriceData {
  [key: string]: string;
}

export class AlphaVantageClient {
  constructor() {}

  async getData(symbol: string): Promise<AVGetDataResult> {
    let getDataQuery: GetData = {
      symbol: symbol,
      apikey: process.env.AV_API_KEY || '',
      function: 'TIME_SERIES_DAILY_ADJUSTED',
      outputsize: 'full',
    };
    var url = URL + queryString.stringify(getDataQuery);

    console.log('Making request to the url: ', url);
    var opt = {
      url: url,
      // ,
      // headers: {
      //     "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36"
      // }
    };

    return new Promise((resolve, reject) => {
      request(opt, (err, res, body) => {
        if (err) {
          reject(JSON.parse(body));
        } else {
          resolve(JSON.parse(body));
        }
      });
    });
  }
}

// https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=MSFT&outputsize=full&apikey=demo
// module.exports = new AlphaVantageClient();
// let av = new AlphaVantageClient()
// av.getData('AAPL').then(console.log)
