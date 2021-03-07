import {Watchlist} from '@master-chief/alpaca';
import express from 'express';
import {isAuthenticated} from '../auth';
import {AlpacaClient} from '../client/AlpacaClient';
import {NAV_TITLE, SECONDARY_TITLE} from '../consts';
import {AccessToken} from '../trader';
const portfolioRouter = express.Router();

portfolioRouter.get('/', async (req, res) => {
  res.render('portfolio', {
    title: 'Buy The Dip Club | Portfolio Analysis',
    navTitle: NAV_TITLE,
    message: SECONDARY_TITLE,
    secondaryMessage:
      'This app analyzes the past price pattern of the ticker and calculates the confidence to buy. It depends on variety of factors but the most important one is the momentum speed.',
    ticker: req.query.t,
    tickerType: req.query.type,
    horizon: req.query.h,
    isAuth: res.locals['isAuth'],
  });
});

export {portfolioRouter};
