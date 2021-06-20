import express from 'express';
import {AlpacaClient} from '../client/AlpacaClient';
import {withTryCatchNext} from '../util';

const portfolioHistory = express.Router();

portfolioHistory.get('/', async (req, res, next) => {
  await withTryCatchNext(req, res, next, async (req, res, next) => {
    var sess: any = req.session;
    const isLiveMoney: boolean = sess.liveMoney;
    const alpaca = new AlpacaClient(
      sess.tokens,
      isLiveMoney,
      (req.session as any).apikey,
      (req.session as any).apisecret
    );

    const portfolioHistory = await alpaca.raw().getPortfolioHistory({
      extended_hours: true,
      timeframe: '1D',
      period: '1A',
    });

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(portfolioHistory));
  });
});
export {portfolioHistory};
