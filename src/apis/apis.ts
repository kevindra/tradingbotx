import express from 'express';
import {isAuthenticated} from '../auth';
import {AccessToken} from '../trader';
import {confApiRouter} from './conf';
import {latestConfApiRouter} from './latestconf';
import {liveMoneyRouter} from './livemoney';
import {opportunitiesApiRouter} from './opportunities';
import {tradeApiRouter} from './trade';
import {watchlistsApiRouter} from './watchlists';

const apisRouter = express.Router();

apisRouter.use('/conf', confApiRouter);
apisRouter.use('/latestconf', latestConfApiRouter);
apisRouter.use('/opportunities', opportunitiesApiRouter);
apisRouter.use('/trade', tradeApiRouter);
apisRouter.use('/watchlists', watchlistsApiRouter);
apisRouter.use('/liveMoney', liveMoneyRouter);

export {apisRouter};
