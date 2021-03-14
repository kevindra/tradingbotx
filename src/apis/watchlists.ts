import express from 'express';
import {AlpacaClient} from '../client/AlpacaClient';
import {withTryCatchNext} from '../util';

const watchlistsApiRouter = express.Router();

watchlistsApiRouter.get('/', async (req, res, next) => {
  await withTryCatchNext(req, res, next, async (req, res, next) => {
    const id = req.query.id as string;
    const tokens = (req.session as any).tokens;
    const isLiveMoney: boolean = (req.session as any).liveMoney;
    const alpaca = new AlpacaClient(
      tokens,
      isLiveMoney,
      (req.session as any).apikey,
      (req.session as any).apisecret
    );

    const output = await alpaca.raw().getWatchlist({
      uuid: id,
    });
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(output));
  });
});

watchlistsApiRouter.post('/', async (req, res, next) => {
  await withTryCatchNext(req, res, next, async (req, res, next) => {
    const id = req.body.id as string;
    const name = req.body.name as string;
    const tickers = req.body.tickers as string[];
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
      output = await alpaca.updateWatchlist(id, name, tickers, isLiveMoney);
    } else {
      output = await alpaca.raw().createWatchlist({
        name: name,
        symbols: tickers,
      });
    }

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(output));
  });
});

export {watchlistsApiRouter};
