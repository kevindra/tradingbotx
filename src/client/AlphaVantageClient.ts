import request from 'request';
import queryString from 'query-string';
import momenttz from 'moment-timezone';
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

export interface GlobalQuote {
  [key: string]: Quote;
}
export interface Quote {
  [key: string]: string;
}

export class AlphaVantageClient {
  constructor() {}

  async getQuote(symbol: string): Promise<GlobalQuote> {
    const getDataQuery: GetData = {
      symbol: symbol,
      apikey: process.env.AV_API_KEY || '',
      function: 'GLOBAL_QUOTE',
      outputsize: 'full',
    };
    const url = URL + queryString.stringify(getDataQuery);
    console.log(`URL: ${url}`);
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

  async getData(symbol: string): Promise<AVGetDataResult> {
    const getDataQuery: GetData = {
      symbol: symbol,
      apikey: process.env.AV_API_KEY || '',
      function: 'TIME_SERIES_DAILY_ADJUSTED',
      outputsize: 'full',
    };
    const url = URL + queryString.stringify(getDataQuery);

    console.log(`URL: ${url}`);
    const opt = {
      url: url,
    };

    let data: AVGetDataResult = await new Promise((resolve, reject) => {
      request(opt, (err, res, body) => {
        if (err) {
          reject(JSON.parse(body));
        } else {
          resolve(JSON.parse(body));
        }
      });
    });

    var today = momenttz(new Date()).tz('America/Toronto');
    // if today is not weekend, get the latest price as well to get real time confidence values
    if (!(today.day() == 6 || today.day() == 7)) {
      let quote = (await this.getQuote(symbol))['Global Quote'];
      let todayStr = today.format('YYYY-MM-DD');
      data['Time Series (Daily)'][todayStr] = {
        '1. open': quote['02. open'],
        '2. high': quote['03. high'],
        '3. low': quote['04. low'],
        '4. close': quote['05. price'], // not yet closed, so current price = close
        '5. adjusted close': quote['05. price'], // not yet closed, so current price = close
        '6. volume': quote['06. volume'],
        '7. dividend amount': '0.0000',
        '8. split coefficient': '1.0',
      };
    }

    return data;
  }
}

// https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=MSFT&outputsize=full&apikey=demo
// module.exports = new AlphaVantageClient();
// let av = new AlphaVantageClient();
// // av.getData('AAPL').then(console.log)
// av.getData('AAPL').then(console.log);
