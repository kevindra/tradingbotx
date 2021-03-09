import express from 'express';
import {AlgoExecutor} from '../AlgoExecutor';
import {getAlgosFromRequest, withTryCatchNext} from '../util';

const currentIndicatorsRouter = express.Router();
const algoExecutor = new AlgoExecutor();

currentIndicatorsRouter.get('/', async (req, res, next) => {
  await withTryCatchNext(req, res, next, async (req, res, next) => {
    const ticker = req.query.t as string;
    const currency = req.query.c as string;
    const type = req.query.type as string;
    const horizon = parseInt((req.query.horizon as string) || '365');
    const algosToRun = getAlgosFromRequest(req);

    if (type === 'stocks') {
      const data = await algoExecutor.executeAlgoOnStock(
        ticker,
        horizon,
        algosToRun
      );
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data.timestamps[data.timestamps.length - 1]));
    } else if (type === 'crypto') {
      const data = await algoExecutor.executeAlgoOnCrypto(
        ticker,
        currency,
        horizon,
        algosToRun
      );
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data.timestamps[data.timestamps.length - 1]));
    } else {
      res.end('Not found');
    }
  });
});

export {currentIndicatorsRouter as latestConfApiRouter};
