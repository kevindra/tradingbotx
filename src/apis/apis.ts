import express from 'express';
import {confApiRouter as indicatorsHistoryApiRouter} from './indicatorshistory';
import {latestConfApiRouter as currentIndicatorsApiRouter} from './currentIndicators';
import {liveMoneyRouter} from './livemoney';
import {opportunitiesApiRouter} from './opportunities';
import {tradeApiRouter} from './trade';
import {watchlistsApiRouter} from './watchlists';
import {backtestApiRouter} from './backtest';
import {portfolioHistory} from './portfolioHistory';

const apisRouter = express.Router();

apisRouter.use('/indicators/history', indicatorsHistoryApiRouter);
apisRouter.use('/indicators/current', currentIndicatorsApiRouter);
apisRouter.use('/opportunities', opportunitiesApiRouter);
apisRouter.use('/trade', tradeApiRouter);
apisRouter.use('/watchlists', watchlistsApiRouter);
apisRouter.use('/liveMoney', liveMoneyRouter);
apisRouter.use('/backtest', backtestApiRouter);
apisRouter.use('/portfolio/history', portfolioHistory);

export {apisRouter};
