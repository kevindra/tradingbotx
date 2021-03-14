import express from 'express';
import {MIN_BUY_CONFIDENCE_THRESHOLD, MAX_BUY_CONFIDENCE_THRESHOLD} from '../consts';
import {Opportunities, OpportunitiesFinder} from '../OpportunitiesFinder';
import {AccessToken, Trader} from '../trader';
import {withTryCatchNext} from '../util';

const tradeApiRouter = express.Router();

tradeApiRouter.post('/', async (req, res, next) => {
  await withTryCatchNext(req, res, next, async (req, res, next) => {
    const opp = req.body.opportunities as Opportunities;
    const tokens = (req.session as any).tokens;
    const minTradeAmount = parseInt((req.body.minTradeAmount as string) || '40');
    const maxTradeAmount = parseInt((req.body.maxTradeAmount as string) || '100');
    const minIndicatorValue = parseInt(
      (req.body.minIndicatorValue as string) || `${MIN_BUY_CONFIDENCE_THRESHOLD}`
    );
    const maxIndicatorValue = parseInt(
      (req.body.maxIndicatorValue as string) || `${MAX_BUY_CONFIDENCE_THRESHOLD}`
    );
    const isLiveMoney: boolean = (req.session as any).liveMoney;

    const trader = new Trader(tokens as AccessToken, isLiveMoney);
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
