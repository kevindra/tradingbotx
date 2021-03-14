import {Watchlist} from '@master-chief/alpaca';
import express from 'express';
import {getAllAlgoIds, getAllAlgoNames} from '../algo/algoregistry';
import {AlpacaClient} from '../client/AlpacaClient';
import {NAV_TITLE, SECONDARY_TITLE} from '../consts';
import {withTryCatchNext} from '../util';
const tradingbotRouter = express.Router();

tradingbotRouter.get('/', async (req, res, next) => {
  await withTryCatchNext(req, res, next, async (req, res, next) => {
    var sess: any = req.session;
    let isAuth: boolean = res.locals['isAuth'];
    const isLiveMoney: boolean = (req.session as any).liveMoney;

    // faking a custom list to show popular stocks list
    let lists: Watchlist[] = [
      {
        account_id: '',
        assets: [],
        created_at: '',
        id: 'kevin-popular',
        name: 'Most Popular 80 Stocks',
        updated_at: '',
      },
    ];
    if (isAuth) {
      const alpaca = new AlpacaClient(
        sess.tokens,
        isLiveMoney,
        (req.session as any).apikey,
        (req.session as any).apisecret
      );
      lists = lists.concat(await alpaca.raw().getWatchlists());
    }

    res.render('tradingbot', {
      title: 'TradingBotX | Trading Bot',
      navTitle: NAV_TITLE,
      message: SECONDARY_TITLE,
      isAuth,
      lists,
      algoIds: getAllAlgoIds(),
      algoNames: getAllAlgoNames(),
    });
  });
});

export {tradingbotRouter};
