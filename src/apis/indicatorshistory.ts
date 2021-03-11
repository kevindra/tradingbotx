import express from 'express';
import {SecurityType} from '../types';
import {AlgoExecutor} from '../AlgoExecutor';
import {getAlgosFromRequest, withTryCatchNext} from '../util';
import moment from 'moment-timezone';
import {DATE_FORMAT} from '../consts';

const indicatorsHistoryApiRouter = express.Router();
const algoExecutor = new AlgoExecutor();

indicatorsHistoryApiRouter.get('/', async (req, res, next) => {
  await withTryCatchNext(req, res, next, async (req, res, next) => {
    const ticker = req.query.t as string;
    const currency = (req.query.c as string) || 'USD';
    const type = req.query.type as SecurityType;
    const horizon = parseInt(req.query.horizon as string);
    const endDate = moment(req.query.endDate as string, DATE_FORMAT);
    const algosToRun = getAlgosFromRequest(req);

    if (type === 'stocks') {
      const data = await algoExecutor.executeAlgoOnStock(
        ticker,
        horizon,
        endDate,
        algosToRun
      );
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    } else if (type === 'crypto') {
      const data = await algoExecutor.executeAlgoOnCrypto(
        ticker,
        currency,
        horizon,
        endDate,
        algosToRun
      );
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    } else {
      res.end('Not found');
    }
  });
});

export {indicatorsHistoryApiRouter as confApiRouter};
