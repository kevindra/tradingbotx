import express from 'express';
import {NAV_TITLE, SECONDARY_TITLE} from '../consts';
const router = express.Router();

router.get('/', (req, res) => {
  // Default
  if(!req.query.t) {
    req.query.t = 'BTC'
    req.query.tickerType = 'crypto'
  }
  req.query.h = '100'

  res.render('index', {
    title: 'Buy The Dip Club | Quick Analysis',
    navTitle: NAV_TITLE,
    message: SECONDARY_TITLE,
    secondaryMessage:
      'This app analyzes the past price pattern of the ticker and calculates the confidence to buy. It depends on variety of factors but the most important one is the momentum speed.',
    ticker: req.query.t,
    tickerType: req.query.type,
    horizon: req.query.h,
    isAuth: res.locals['isAuth']
  });
});

export {router as rootRouter};
