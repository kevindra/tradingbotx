import {Watchlist} from '@master-chief/alpaca';
import express from 'express';
import {AlpacaClient} from '../client/AlpacaClient';
import {NAV_TITLE, SECONDARY_TITLE} from '../consts';
const tradingbotRouter = express.Router();

tradingbotRouter.get('/', async (req, res) => {
  var sess: any = req.session;
  let isAuth: boolean = res.locals['isAuth'];

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
    const alpaca = new AlpacaClient(sess.tokens);
    lists = lists.concat(await alpaca.raw().getWatchlists());
  }

  res.render('tradingbot', {
    title: 'Buy The Dip Club | Trading Bot',
    navTitle: NAV_TITLE,
    message: SECONDARY_TITLE,
    isAuth,
    lists,
  });
});

export {tradingbotRouter};
