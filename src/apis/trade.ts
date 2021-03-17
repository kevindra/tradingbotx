import express from 'express';
import {
  MIN_INDICATOR_VALUE_DEFAULT,
  MAX_INDICATOR_VALUE_DEFAULT,
  MIN_TRADE_AMOUNT_DEFAULT,
  MAX_TRADE_AMOUNT_DEFAULT,
} from '../consts';
import {Opportunities, OpportunitiesFinder} from '../OpportunitiesFinder';
import {AccessToken, Trader} from '../trader';
import {withTryCatchNext} from '../util';

const tradeApiRouter = express.Router();

tradeApiRouter.post('/', async (req, res, next) => {
  await withTryCatchNext(req, res, next, async (req, res, next) => {
    const opp = req.body.opportunities as Opportunities;
    const tokens = (req.session as any).tokens;
    const minTradeAmount = parseInt(
      (req.body.minTradeAmount as string) || `${MIN_TRADE_AMOUNT_DEFAULT}`
    );
    const maxTradeAmount = parseInt(
      (req.body.maxTradeAmount as string) || `${MAX_TRADE_AMOUNT_DEFAULT}`
    );
    const minIndicatorValue = parseInt(
      (req.body.minIndicatorValue as string) || `${MIN_INDICATOR_VALUE_DEFAULT}`
    );
    const maxIndicatorValue = parseInt(
      (req.body.maxIndicatorValue as string) || `${MAX_INDICATOR_VALUE_DEFAULT}`
    );
    const isLiveMoney: boolean = (req.session as any).liveMoney;

    const trader = new Trader(
      tokens as AccessToken,
      isLiveMoney,
      (req.session as any).apikey,
      (req.session as any).apisecret
    );
    const orders = await trader.performTrades(
      opp,
      minTradeAmount,
      maxTradeAmount,
      minIndicatorValue,
      maxIndicatorValue
    );

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({orders}));
  });
});

export {tradeApiRouter};
