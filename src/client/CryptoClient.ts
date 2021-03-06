import request from 'request';
import Mustache from 'mustache';

const URL =
  'https://min-api.cryptocompare.com/data/histoday?aggregate=1&e=CCCAGG&extraParams=CryptoCompare&fsym={{ticker}}&limit={{periodInDays}}&tryConversion=false&tsym={{currency}}';

export interface Query {
  ticker: string;
  currency: string;
  periodInDays: number;
}

export interface CryptoGetDataResult {
  Data: CryptoData[];
}

export interface CryptoData {
  time: number;
  close: number;
  high: number;
  low: number;
  open: number;
  volumefrom: number;
  volumeto: number;
  conversionType: string;
  conversionSymbol: string;
}

export class CryptoClient {
  constructor() {}

  /**
   *
   * @param query
   * {
   *  ticker: "BTC",
   *  currency: "USD"
   * }
   */
  async getData(query: Query): Promise<CryptoGetDataResult> {
    const url = this._buildUrl(query);

    console.log('Making request to the url: ', url);
    const opt = {
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

  _buildUrl(query: Query) {
    return Mustache.render(URL, {
      ticker: query.ticker.toUpperCase(),
      currency: query.currency.toUpperCase(),
      periodInDays: query.periodInDays,
    });
  }
}

// https://min-api.cryptocompare.com/data/histoday?aggregate=1&e=CCCAGG&extraParams=CryptoCompare&fsym=BTC&limit=365&tryConversion=false&tsym=USD
// module.exports = new CryptoClient();
// const cc = new CryptoClient()
// cc.getData({ticker: 'BTC', currency: 'USD'}).then((data) => {
//     // console.log(data);
//     const fs = require('fs')
//     fs.writeFileSync('./data/timeseries/BTC.json', JSON.stringify(data, null, 2))
// })
