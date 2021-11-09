import express from 'express';
import moment from 'moment-timezone';

import { AlgoExecutor } from '../AlgoExecutor';
import { getAlgosFromRequest, withTryCatchNext } from '../util';

const currentIndicatorsRouter = express.Router();
const algoExecutor = new AlgoExecutor();
// TODO @deprecated
// No need to keep it - no dependency
currentIndicatorsRouter.get('/', async (req, res, next) => {
  await withTryCatchNext(req, res, next, async (req, res, next) => {
    const ticker = req.query.t as string;
    const currency = req.query.c as string;
    const type = req.query.type as string;
    const horizon = parseInt((req.query.horizon as string) || '365');
    const date = moment(req.query.date as string, 'YYYY-MM-DD');
    const algosToRun = getAlgosFromRequest(req);

    const priceData = await algoExecutor.execute(
      ticker,
      horizon,
      date,
      algosToRun
    );

    if (priceData === undefined) {
      res.end('Not found');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify(priceData.timestamps[priceData.timestamps.length - 1])
      );
    }
  });
});

export {currentIndicatorsRouter as latestConfApiRouter};
