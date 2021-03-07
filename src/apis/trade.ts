import express from 'express';
import {isAuthenticated} from '../auth';
import {Opportunities, OpportunitiesFinder} from '../OpportunitiesFinder';
import {AccessToken, Trader} from '../trader';

const tradeApiRouter = express.Router();

tradeApiRouter.post('/', async (req, res) => {
  const opp = req.body.opp as Opportunities;
  const tokens = (req.session as any).tokens;

  const trader = new Trader(tokens as AccessToken);
  const orders = await trader.performTrades(opp);

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({orders}));
});

export {tradeApiRouter};
