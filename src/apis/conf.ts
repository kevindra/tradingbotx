import express from 'express';
import {SecurityType} from '../types';
import {ConfidenceCalculator} from '../ConfidenceCalculator';
import { withTryCatchNext } from '../util';

const confApiRouter = express.Router();
const confidenceCalculator = new ConfidenceCalculator();

confApiRouter.get('/', async (req, res, next) => {
  await withTryCatchNext(req, res, next, async (req, res, next) => {
    const ticker = req.query.t as string;
    const currency = req.query.c as string;
    const type = req.query.type as SecurityType;
    const horizon = parseInt((req.query.horizon as string) || '365');

    if (type === 'stocks') {
      const data = await confidenceCalculator.stockBuyerConf(ticker, horizon);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    } else if (type === 'crypto') {
      const data = await confidenceCalculator.cryptoBuyerConf(
        ticker,
        currency,
        horizon
      );
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    } else {
      res.end('Not found');
    }
  });
});

export {confApiRouter};
