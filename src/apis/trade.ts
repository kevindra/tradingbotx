import express from 'express';
import {isAuthenticated} from '../auth';
import {BUY_CONFIDENCE_THRESHOLD, SELL_CONFIDENCE_THRESHOLD} from '../consts';
import {Opportunities, OpportunitiesFinder} from '../OpportunitiesFinder';
import {AccessToken, Trader} from '../trader';

const tradeApiRouter = express.Router();

tradeApiRouter.post('/', async (req, res) => {
  const opp = req.body.opp as Opportunities;
  const tokens = (req.session as any).tokens;
  const minBuyAmount = parseInt((req.body.minBuyAmount as string) || '40');
  const maxBuyAmount = parseInt((req.body.maxBuyAmount as string) || '100');
  const buyConfThreshold = parseInt(
    (req.body.buyConfThreshold as string) || `${BUY_CONFIDENCE_THRESHOLD}`
  );
  const sellConfThreshold = parseInt(
    (req.body.sellConfThreshold as string) || `${SELL_CONFIDENCE_THRESHOLD}`
  );
  const isLiveMoney: boolean = (req.session as any).liveMoney;

  const trader = new Trader(tokens as AccessToken, isLiveMoney);
  const orders = await trader.performTrades(opp, minBuyAmount, maxBuyAmount, buyConfThreshold, sellConfThreshold);

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({orders}));
});

export {tradeApiRouter};
