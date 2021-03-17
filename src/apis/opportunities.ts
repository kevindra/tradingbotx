import express from 'express';
import moment from 'moment-timezone';
import {
  LOOK_BACK_DAYS_DEFAULT,
  MAX_INDICATOR_VALUE_DEFAULT,
  MIN_INDICATOR_VALUE_DEFAULT,
} from '../consts';
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
    const horizon = parseInt(
      (req.query.horizon as string) || `${LOOK_BACK_DAYS_DEFAULT}`
    );
    // TODO - this is fine for now.. but we may need to evolve it to allow more query mechanisms
    const minIndicatorValue = parseFloat(
      (req.query.minIndicatorValue as string) ||
        `${MIN_INDICATOR_VALUE_DEFAULT}`
    );
    const maxIndicatorValue = parseFloat(
      (req.query.maxIndicatorValue as string) ||
        `${MAX_INDICATOR_VALUE_DEFAULT}`
    );

    // algo to run
    const algoToRun = getAlgoFromRequest(req);
    // indicator to use from the algo's output, 0-based
    const indicator = getIndicatorFromRequest(req);

    const opportunities = await opportunitiesFinder.findOpportunities(
      tickers,
      horizon,
      moment().tz('America/Toronto'), // today's date EST
      algoToRun,
      indicator,
      minIndicatorValue,
      maxIndicatorValue
    );
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(opportunities));
  });
});

export {opportunitiesApiRouter};
