import express from 'express';
import {OpportunitiesFinder, OpportunityType} from '../OpportunitiesFinder';
import {
  getAlgoFromRequest,
  getIndicatorFromRequest,
  withTryCatchNext,
} from '../util';

const opportunitiesApiRouter = express.Router();
const opportunitiesFinder = new OpportunitiesFinder();

opportunitiesApiRouter.get('/', async (req, res, next) => {
  await withTryCatchNext(req, res, next, async (req, res, next) => {
    const flatTickers = (req.query.tickers as string) || '';
    let tickers: string[] = flatTickers.split(',');
    const horizon = parseInt((req.query.horizon as string) || '365');
    // TODO - each algo will have their own configuration
    const minIndicatorValue = parseFloat(
      (req.query.minIndicatorValue as string) || '80'
    );
    const maxIndicatorValue = parseFloat(
      (req.query.maxIndicatorValue as string) || '100'
    );
    // if indicator value is in the input range, would you buy or sell the ticker
    const opportunityType =
      (req.query.opportunityType as OpportunityType) || 'buy';

    // algo to run
    const algoToRun = getAlgoFromRequest(req);
    // indicator to use from the algo's output, 0-based
    const indicator = getIndicatorFromRequest(req);

    const opportunities = await opportunitiesFinder.findOpportunities(
      tickers,
      horizon,
      algoToRun,
      indicator,
      minIndicatorValue,
      maxIndicatorValue,
      opportunityType
    );
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(opportunities));
  });
});

export {opportunitiesApiRouter};
