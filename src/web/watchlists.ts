import {Watchlist} from '@master-chief/alpaca';
import express from 'express';
import {AlpacaClient} from '../client/AlpacaClient';
import {NAV_TITLE} from '../consts';
const watchlistsRouter = express.Router();

watchlistsRouter.get('/create', async (req, res) => {
  var sess: any = req.session;
  res.render('watchlists', {
    title: 'Buy The Dip Club | Watchlists',
    navTitle: NAV_TITLE,
    message: 'Create watchlist',
    secondaryMessage:
      'This app analyzes the past price pattern of the ticker and calculates the confidence to buy. It depends on variety of factors but the most important one is the momentum speed.',
    isAuth: res.locals['isAuth'],
    create: true,
  });
});

watchlistsRouter.get('/edit', async (req, res) => {
  var sess: any = req.session;
  const id = req.query.id as string;
  const isLiveMoney: boolean = (req.session as any).liveMoney;
  const alpaca = new AlpacaClient(sess.tokens, isLiveMoney);
  const watchlist = await alpaca.raw().getWatchlist({
    uuid: id,
  });

  res.render('watchlists', {
    title: 'Buy The Dip Club | Watchlists',
    navTitle: NAV_TITLE,
    message: 'Edit your watchlist',
    secondaryMessage:
      'This app analyzes the past price pattern of the ticker and calculates the confidence to buy. It depends on variety of factors but the most important one is the momentum speed.',
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

watchlistsRouter.get('/', async (req, res) => {
  var sess: any = req.session;
  let watchlists: Watchlist[] = [];

  if (res.locals['isAuth']) {
    const id = req.query.id as string;
    const tokens = (req.session as any).tokens;
    const isLiveMoney: boolean = (req.session as any).liveMoney;
    const alpaca = new AlpacaClient(tokens, isLiveMoney);

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
    title: 'Buy The Dip Club | Watchlists',
    navTitle: NAV_TITLE,
    message: 'Manage your watchlists',
    secondaryMessage:
      'This app analyzes the past price pattern of the ticker and calculates the confidence to buy. It depends on variety of factors but the most important one is the momentum speed.',
    isAuth: res.locals['isAuth'],
    list: true,
    watchlists: watchlists,
  });
});

export {watchlistsRouter};
