import express from 'express';
import {AlpacaClient} from '../client/AlpacaClient';

const watchlistsApiRouter = express.Router();

watchlistsApiRouter.get('/', async (req, res) => {
  const id = req.query.id as string;
  const tokens = (req.session as any).tokens;
  const isLiveMoney: boolean = (req.session as any).liveMoney;
  const alpaca = new AlpacaClient(tokens, isLiveMoney);

  const output = await alpaca.raw().getWatchlist({
    uuid: id,
  });
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(output));
});

watchlistsApiRouter.post('/', async (req, res) => {
  const id = req.body.id as string;
  const name = req.body.name as string;
  const tickers = req.body.tickers as string[];
  const tokens = (req.session as any).tokens;
  const isLiveMoney: boolean = (req.session as any).liveMoney;
  const alpaca = new AlpacaClient(tokens, isLiveMoney);

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

export {watchlistsApiRouter};
