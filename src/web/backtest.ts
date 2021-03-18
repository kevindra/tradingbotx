import {Position, Watchlist} from '@master-chief/alpaca';
import express from 'express';
import moment from 'moment';
import request from 'request';
import {getAllAlgoIds, getAllAlgoNames} from '../algo/algoregistry';
import {AlpacaClient} from '../client/AlpacaClient';
import {
  MAX_INDICATOR_VALUE_DEFAULT,
  MAX_TRADE_AMOUNT_DEFAULT,
  MIN_INDICATOR_VALUE_DEFAULT,
  MIN_TRADE_AMOUNT_DEFAULT,
  NAV_TITLE,
  SECONDARY_TITLE,
} from '../consts';
import {withTryCatchNext} from '../util';
import qs from 'query-string';
import {BacktestResults} from '../apis/backtest';
import {format, formatAndColor} from './account';

const backtestRouter = express.Router();

backtestRouter.get('/', async (req, res, next) => {
  // Default
  const tickers = ((req.query.tickers as string) || '').split(',');
  const algoIds = (req.query.algoIds as string[]) || [];
  const lookbackDays = parseInt((req.query.horizon as string) || '365');
  const trainingCoeff = parseFloat(
    (req.query.trainingCoeff as string) || '0.3'
  );
  const minTradeAmount = parseInt(
    (req.query.minTradeAmount as string) || `${MIN_TRADE_AMOUNT_DEFAULT}`
  );
  const maxTradeAmount = parseInt(
    (req.query.maxTradeAmount as string) || `${MAX_TRADE_AMOUNT_DEFAULT}`
  );
  const minIndicatorValue = parseInt(
    (req.query.minIndicatorValue as string) || `${MIN_INDICATOR_VALUE_DEFAULT}`
  );
  const maxIndicatorValue = parseInt(
    (req.query.maxIndicatorValue as string) || `${MAX_INDICATOR_VALUE_DEFAULT}`
  );

  let formattedResults: any;
  if (tickers.length > 0 && algoIds.length > 0) {
    formattedResults = {};
    const params = {
      tickers: tickers.join(','),
      algoIds: algoIds.join(','),
      horizon: lookbackDays,
      minIndicatorValue: minIndicatorValue,
      maxIndicatorValue: maxIndicatorValue,
      minTradeAmount: minTradeAmount,
      maxTradeAmount: maxTradeAmount,
      trainingCoeff: trainingCoeff,
    };
    let r: BacktestResults = await new Promise((resolve, reject) => {
      request.get(
        req.protocol +
          '://' +
          req.get('host') +
          '/api/backtest?' +
          qs.stringify(params),
        {},
        (err, apiresponse, body) => {
          if (err) {
            reject(err);
            return;
          }

          // console.log(body);
          resolve(JSON.parse(body) as BacktestResults);
        }
      );
    });

    let portfolio: any = {
      peakCost: format(r.portfolio.peakCost || 0, 'dollar', false),
      totalCost: format(r.portfolio.totalCost || 0, 'dollar', false),
      totalProfitLoss: formatAndColor(
        r.portfolio.totalProfitLoss || 0,
        'dollar'
      ),
      totalProfitLossPct: formatAndColor(
        r.portfolio.totalProfitLossPct * 100 || 0,
        'pct'
      ),
    };
    formattedResults.portfolio = portfolio;

    let pos: any[] = [];

    Object.keys(r.positions || {}).forEach(i => {
      let p = (r.positions || {})[i];
      pos.push({
        symbol: i,
        qty: p.qty.toFixed(2),
        avgCost: format(p.avgCost, 'dollar', false),
        totalCost: format(p.totalCost, 'dollar', false),
        profitLoss: formatAndColor(p.profitLoss, 'dollar'),
        profitLossPct: formatAndColor(
          (100 * p.profitLoss) / p.totalCost,
          'pct'
        ),
      });
    });
    formattedResults.positions = pos;

    let trades: any[] = r.trades.map(t => {
      return {
        symbol: t.symbol,
        qty: t.qty.toFixed(2),
        timestampEstStr: t.timestampStr,
        type: t.type,
        price: format(t.price, 'dollar', false),
        dayNum: t.dayNum,
        timestamp: t.timestamp,
        tradeProfitLoss: formatAndColor(t.tradeProfitLoss, 'dollar'),
        cummulativeProfitLoss: formatAndColor(
          t.cummulativeProfitLoss,
          'dollar'
        ),
        algoIndicatorValue: t.indicatorValue.toFixed(2) + '%',
      };
    });
    formattedResults.trades = trades;
  }

  res.render('backtest', {
    title: 'TradingBotX | Backtest',
    navTitle: NAV_TITLE,
    message: 'Backtest Algorithms',
    secondaryMessage:
      'This is where you can evaluate past performance of the algorithms on a specific set of stock symbols.',
    tickers: tickers.join(','),
    horizon: lookbackDays,
    trainingCoeff: trainingCoeff,
    minIndicatorValue: minIndicatorValue,
    maxIndicatorValue: maxIndicatorValue,
    minTradeAmount: minTradeAmount,
    maxTradeAmount: maxTradeAmount,
    selectedAlgoIds: algoIds || [],
    algoIds: getAllAlgoIds(),
    algoNames: getAllAlgoNames(),
    isAuth: res.locals['isAuth'],
    results: formattedResults,
  });
});

export {backtestRouter};
