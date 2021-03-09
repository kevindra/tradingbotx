import express from 'express';
import {BUY_CONFIDENCE_THRESHOLD, SELL_CONFIDENCE_THRESHOLD} from '../consts';
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
    const indicatorMinValue = parseInt(
      (req.body.indicatorMinValue as string) || `${BUY_CONFIDENCE_THRESHOLD}`
    );
    const indicatorMaxValue = parseInt(
      (req.body.indicatorMaxValue as string) || `${SELL_CONFIDENCE_THRESHOLD}`
    );
    const isLiveMoney: boolean = (req.session as any).liveMoney;

    const trader = new Trader(tokens as AccessToken, isLiveMoney);
    const orders = await trader.performTrades(
      opp,
      minTradeAmount,
      maxTradeAmount,
      indicatorMinValue,
      indicatorMaxValue
    );

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({orders}));
  });
});

export {tradeApiRouter};
