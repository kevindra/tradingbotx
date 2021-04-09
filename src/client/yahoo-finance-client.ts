const yf = require('yahoo-finance');

export interface Quote {
  summaryDetail: SummaryDetail;
  price: Price;
}

export interface SummaryDetail {}

export interface Price {
  regularMarketPrice: number;
  regularMarketDayLow: number;
  regularMarketDayHigh: number;
  regularMarketVolume: number;
  regularMarketOpen: number;
}

export const getQuote = async function (symbol: string) {
  return <Quote>await yf.quote(symbol);
};
