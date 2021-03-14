import {Watchlist} from '@master-chief/alpaca';
import express from 'express';
import {AlpacaClient} from '../client/AlpacaClient';
import {NAV_TITLE} from '../consts';
import {withTryCatchNext} from '../util';
const watchlistsRouter = express.Router();

watchlistsRouter.get('/create', (req, res) => {
  var sess: any = req.session;
  res.render('watchlists', {
    title: 'TradingBotX | Watchlists',
    navTitle: NAV_TITLE,
    message: 'Create watchlist',
    secondaryMessage:
      'Here, you can manage your watchlists for your favorite stocks and use them as inputs to the algorithms.',
    isAuth: res.locals['isAuth'],
    create: true,
  });
});

watchlistsRouter.get('/edit', async (req, res, next) => {
  await withTryCatchNext(req, res, next, async (req, res, next) => {
    var sess: any = req.session;
    const id = req.query.id as string;
    const isLiveMoney: boolean = (req.session as any).liveMoney;
    const alpaca = new AlpacaClient(
      sess.tokens,
      isLiveMoney,
      (req.session as any).apikey,
      (req.session as any).apisecret
    );
    const watchlist = await alpaca.raw().getWatchlist({
      uuid: id,
    });

    res.render('watchlists', {
      title: 'TradingBotX | Watchlists',
      navTitle: NAV_TITLE,
      message: 'Edit your watchlist',
      secondaryMessage:
        'Here, you can manage your watchlists for your favorite stocks and use them as inputs to the algorithms.',
      isAuth: res.locals['isAuth'],
      edit: true,
      name: watchlist.name,
      tickers: watchlist.assets
        .map(a => {
          return a.symbol;
        })
        .join(','),
      id: watchlist.id,
    });
  });
});

watchlistsRouter.get('/', async (req, res, next) => {
  await withTryCatchNext(req, res, next, async (req, res, next) => {
    var sess: any = req.session;
    let watchlists: Watchlist[] = [];

    if (res.locals['isAuth']) {
      const id = req.query.id as string;
      const tokens = (req.session as any).tokens;
      const isLiveMoney: boolean = (req.session as any).liveMoney;
      const alpaca = new AlpacaClient(
        tokens,
        isLiveMoney,
        (req.session as any).apikey,
        (req.session as any).apisecret
      );

      let output;
      if (id) {
        output = [
          await alpaca.raw().getWatchlist({
            uuid: id,
          }),
        ];
      } else {
        output = await alpaca.raw().getWatchlists();
      }

      watchlists = await Promise.all(
        output.map(async o => {
          return await alpaca.raw().getWatchlist({uuid: o.id});
        })
      );
    }

    res.render('watchlists', {
      title: 'TradingBotX | Watchlists',
      navTitle: NAV_TITLE,
      message: 'Manage your watchlists',
      secondaryMessage:
        'Here, you can manage your watchlists for your favorite stocks and use them as inputs to the algorithms.',
      isAuth: res.locals['isAuth'],
      list: true,
      watchlists: watchlists,
    });
  });
});

export {watchlistsRouter};
