import express from 'express';
import {OpportunitiesFinder} from '../OpportunitiesFinder';

const opportunitiesApiRouter = express.Router();
const opportunitiesFinder = new OpportunitiesFinder();

opportunitiesApiRouter.get('/', async (req, res) => {
  const flatTickers = (req.query.tickers as string) || '';
  let tickers: string[] = flatTickers.split(',');
  const horizon = parseInt((req.query.horizon as string) || '365');
  const buyConfThreshold = parseInt(
    (req.query.buyConfThreshold as string) || '80'
  );
  const sellConfThreshold = parseInt(
    (req.query.sellConfThreshold as string) || '80'
  );

  const opportunities = await opportunitiesFinder.findOpportunities(
    tickers,
    horizon,
    buyConfThreshold,
    sellConfThreshold
  );
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(opportunities));
});

export {opportunitiesApiRouter};
