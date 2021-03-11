import request from 'request';
import Mustache from 'mustache';

const URL = `https://min-api.cryptocompare.com/data/histoday?aggregate=1&e=__CRYPTO_API_KEY__&extraParams=CryptoCompare&fsym={{ticker}}&limit={{periodInDays}}&tryConversion=false&tsym={{currency}}`;

export interface Query {
  ticker: string;
  currency: string;
  lookBackDays: number;
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
    let url = this._buildUrl(query);
    url = url.replace(
      '__CRYPTO_API_KEY__',
      process.env['CRYPTO_API_KEY'] || ''
    );
    const opt = {
      url: url,
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
      periodInDays: query.lookBackDays,
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
