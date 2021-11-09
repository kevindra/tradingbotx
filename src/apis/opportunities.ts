import express from 'express';
import moment, { Moment } from 'moment-timezone';

import { Algo } from '../algo/algo';
import { AlgoExecutor } from '../AlgoExecutor';
import {
    LOOK_BACK_DAYS_DEFAULT, MAX_INDICATOR_VALUE_DEFAULT, MIN_INDICATOR_VALUE_DEFAULT
} from '../consts';
import { getCurrentOpportunity, Opportunities, OpportunitiesFinder } from '../OpportunitiesFinder';
import { filterOpportunities } from '../opportunity-filter';
import { getAlgoFromRequest, getIndicatorFromRequest, withTryCatchNext } from '../util';

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
    const condition = (req.query.condition as string) || '';

    // algo to run
    const algoToRun = getAlgoFromRequest(req);
    // indicator to use from the algo's output, 0-based // TODO FIX ME - allow only 1 indicator value per algo
    const indicator = getIndicatorFromRequest(req);

    const opportunities = await Promise.all(
      tickers.map(async ticker => {
        return await getCurrentOpportunity(
          ticker,
          horizon,
          moment().tz('America/Toronto'),
          algoToRun
        );
      })
    );

    const filteredOpportunities = filterOpportunities(
      opportunities,
      indicator,
      condition
    );

    const finalOpportunities = <Opportunities>{
      opportunities: filteredOpportunities,
    };
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(finalOpportunities));
  });
});

export {opportunitiesApiRouter};
