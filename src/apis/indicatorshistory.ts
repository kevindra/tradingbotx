import express from 'express';
import {SecurityType} from '../types';
import {AlgoExecutor, AlgosResponse, AlgoTimestamps} from '../AlgoExecutor';
import {getAlgosFromRequest, withTryCatchNext} from '../util';
import moment from 'moment-timezone';
import {DATE_FORMAT} from '../consts';
import {SecurityTimeseriesManager} from '../SecurityTimeseriesManager';
import {getSlidingWindowOpportunities} from '../OpportunitiesFinder';

const indicatorsHistoryApiRouter = express.Router();
const algoExecutor = new AlgoExecutor();
const timeseriesManager = new SecurityTimeseriesManager();

indicatorsHistoryApiRouter.get('/', async (req, res, next) => {
  await withTryCatchNext(req, res, next, async (req, res, next) => {
    const ticker = req.query.t as string;
    const currency = (req.query.c as string) || 'USD';
    const type = req.query.type as SecurityType;
    const horizon = parseInt(req.query.horizon as string);
    const endDate = moment(req.query.endDate as string, DATE_FORMAT);
    const algosToRun = getAlgosFromRequest(req);

    if (type === 'stocks') {
      const stockData = await timeseriesManager.getStockTimeseries(
        ticker,
        horizon,
        endDate
      );
      const data = await algoExecutor.execute(
        stockData,
        algosToRun,
        0,
        stockData.prices.length
      );
      // Enable this for window based calculatations
      // const x = await getSlidingWindowOpportunities(
      //   ticker,
      //   horizon,
      //   endDate,
      //   algosToRun[0],
      //   100
      // );
      // const data: AlgosResponse = {
      //   algoNames: algosToRun.map(a => a.name()),
      //   types: algosToRun.map(a => a.actionType()),
      //   timestamps: x.map(
      //     o =>
      //       <AlgoTimestamps>{
      //         price: o.price,
      //         timestamp: o.timestamp,
      //         algoOutputs: [o.indicatorValues],
      //       }
      //   ),
      // };
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
