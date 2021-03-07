import express from 'express';
import session from 'express-session';
import path from 'path';
import {ConfidenceCalculator} from './ConfidenceCalculator';
import {AccessToken, Trader} from './trader';
import {SecurityType} from './types';
import dotenv from 'dotenv';
import {Opportunities, OpportunitiesFinder} from './OpportunitiesFinder';
import popularTickers = require('./popularTickers.json');
import bodyParser from 'body-parser';
import request from 'request';
import {AlpacaClient} from './client/AlpacaClient';
import {nextTick} from 'process';
import {Watchlist} from '@master-chief/alpaca';
import {watch} from 'fs';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
app.use(
  session({secret: 'ssshhhhhhhhhhhh', saveUninitialized: true, resave: true})
);

const NAV_TITLE = 'Buy The Dip Club';
const SECONDARY_TITLE = 'Stock/Crypto Buy Predictor & Trader';
const confidenceCalculator = new ConfidenceCalculator();
const opportunitiesFinder = new OpportunitiesFinder();

app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use((req, res, next) => {
  console.log('here ' + process.env.ENV);
  if (process.env.ENV === 'dev') {
    (req.session as any).tokens = {
      access_token: 'd6d2a08d-b9c5-4b3e-96e9-6e021a0c52a2',
      token_type: 'Bearer',
      scope: 'account:write trading',
    };
    console.log('token updated');
  }
  next();
});

app.get('/', (req, res) => {
  res.render('index', {
    title: 'Buy The Dip Club | Quick Analysis',
    navTitle: NAV_TITLE,
    message: SECONDARY_TITLE,
    secondaryMessage:
      'This app analyzes the past price pattern of the ticker and calculates the confidence to buy. It depends on variety of factors but the most important one is the momentum speed.',
    ticker: req.query.t,
    tickerType: req.query.type,
    horizon: req.query.h,
    tokens: (req.session as any).tokens,
  });
});

app.get('/watchlists/create', async (req, res) => {
  var sess: any = req.session;
  let isAuth = await isAuthenticated(sess.tokens as AccessToken);

  res.render('watchlists', {
    title: 'Buy The Dip Club | Watchlists',
    navTitle: NAV_TITLE,
    message: 'Create watchlist',
    secondaryMessage:
      'This app analyzes the past price pattern of the ticker and calculates the confidence to buy. It depends on variety of factors but the most important one is the momentum speed.',
    isAuth,
    create: true,
  });
});

app.get('/watchlists/edit', async (req, res) => {
  var sess: any = req.session;
  let isAuth = await isAuthenticated(sess.tokens as AccessToken);
  const id = req.query.id as string;
  const alpaca = new AlpacaClient(sess.tokens);
  const watchlist = await alpaca.raw().getWatchlist({
    uuid: id,
  });

  res.render('watchlists', {
    title: 'Buy The Dip Club | Watchlists',
    navTitle: NAV_TITLE,
    message: 'Edit your watchlist',
    secondaryMessage:
      'This app analyzes the past price pattern of the ticker and calculates the confidence to buy. It depends on variety of factors but the most important one is the momentum speed.',
    isAuth,
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

app.get('/watchlists', async (req, res) => {
  var sess: any = req.session;
  let isAuth = await isAuthenticated(sess.tokens as AccessToken);
  let watchlists: Watchlist[] = [];

  console.log('Trader received: ' + JSON.stringify(req.body));
  if (isAuth) {
    const id = req.query.id as string;
    const tokens = (req.session as any).tokens;
    const alpaca = new AlpacaClient(tokens);

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
    isAuth,
    list: true,
    watchlists: watchlists,
  });
});

app.get('/portfolio', async (req, res) => {
  res.render('portfolio', {
    title: 'Buy The Dip Club | Portfolio Analysis',
    navTitle: NAV_TITLE,
    message: SECONDARY_TITLE,
    secondaryMessage:
      'This app analyzes the past price pattern of the ticker and calculates the confidence to buy. It depends on variety of factors but the most important one is the momentum speed.',
    ticker: req.query.t,
    tickerType: req.query.type,
    horizon: req.query.h,
    tokens: (req.session as any).tokens,
  });
});

app.get('/tradingbot', async (req, res) => {
  var sess: any = req.session;
  let isAuth = await isAuthenticated(sess.tokens as AccessToken);

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

app.get('/login', (req, res) => {
  var sess: any = req.session;
  res.render('login', {
    title: 'Buy The Dip Club | Login',
    navTitle: NAV_TITLE,
    message: SECONDARY_TITLE,
    clientId: process.env.ALP_CLIENT_ID,
    secret: process.env.ALP_CLIENT_SECRET,
    redirectUri: process.env.ALP_REDIRECT_URI,
    tokens: sess.tokens,
  });
});

app.get('/oauth', async (req, res) => {
  const code = req.query.code;
  let sess = req.session;

  if (!code) {
    res.send('Login denied!');
    return;
  }
  const url = 'https://api.alpaca.markets/oauth/token';

  console.log('Making request to the url: ', url);

  const params = {
    grant_type: 'authorization_code',
    code: code,
    client_id: process.env.ALP_CLIENT_ID,
    client_secret: process.env.ALP_CLIENT_SECRET,
    redirect_uri: process.env.ALP_REDIRECT_URI,
  };

  return new Promise((resolve, reject) => {
    request.post(
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        url: url,
        form: params,
      },
      (err, result, body) => {
        if (err) {
          res.redirect('/login');
          resolve();
        } else {
          const tokens = JSON.parse(body);
          (sess as any)['tokens'] = tokens;
          res.redirect('/login');
          resolve();
        }
      }
    );
  });
});

/** APIs */
app.get('/api/conf', async (req, res) => {
  const ticker = req.query.t as string;
  const currency = req.query.c as string;
  const type = req.query.type as SecurityType;
  const horizon = parseInt((req.query.horizon as string) || '365');

  if (type === 'stocks') {
    const data = await confidenceCalculator.stockBuyerConf(ticker, horizon);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  } else if (type === 'crypto') {
    const data = await confidenceCalculator.cryptoBuyerConf(
      ticker,
      currency,
      horizon
    );
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  } else {
    res.end('Not found');
  }
});

app.get('/api/latestconf', async (req, res) => {
  console.log(req.query);
  const ticker = req.query.t as string;
  const currency = req.query.c as string;
  const type = req.query.type as string;
  const horizon = parseInt((req.query.horizon as string) || '365');

  try {
    if (type === 'stocks') {
      const data = await confidenceCalculator.stockBuyerConf(ticker, horizon);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data[data.length - 2]));
    } else if (type === 'crypto') {
      const data = await confidenceCalculator.cryptoBuyerConf(
        ticker,
        currency,
        horizon
      );
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data[data.length - 2]));
    } else {
      res.end('Not found');
    }
  } catch (err) {
    res.end('Error ' + err);
  }
});

app.get('/api/opportunities', async (req, res) => {
  console.log(req.query);
  const flatTickers = (req.query.tickers as string) || '';
  let tickers: string[] = flatTickers.split(',');
  if (tickers.length == 0) tickers = popularTickers;
  const horizon = parseInt((req.query.horizon as string) || '365');
  const buyConfThreshold = parseInt(
    (req.query.buyConfThreshold as string) || '80'
  );
  const sellConfThreshold = parseInt(
    (req.query.sellConfThreshold as string) || '80'
  );

  const opportunities = await opportunitiesFinder.findOpportunities(
    tickers,
    horizon,
    buyConfThreshold,
    sellConfThreshold
  );
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(opportunities));
});

app.post('/api/trade', async (req, res) => {
  var sess: any = req.session;
  if (!(await isAuthenticated(sess.tokens as AccessToken))) {
    sess.tokens = undefined;
    res.status(403).send('user is not authenticated or session expired.');
  }

  console.log('Trader received: ' + JSON.stringify(req.body));
  const opp = req.body.opp as Opportunities;
  const tokens = (req.session as any).tokens;

  const trader = new Trader(tokens as AccessToken);
  const orders = await trader.performTrades(opp);

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({orders}));
});

app.get('/api/watchlists', async (req, res) => {
  var sess: any = req.session;
  if (!(await isAuthenticated(sess.tokens as AccessToken))) {
    sess.tokens = undefined;
    res.status(403).send('user is not authenticated or session expired.');
  }

  console.log('Trader received: ' + JSON.stringify(req.body));
  const id = req.query.id as string;
  const tokens = (req.session as any).tokens;
  const alpaca = new AlpacaClient(tokens);

  const output = await alpaca.raw().getWatchlist({
    uuid: id,
  });
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(output));
});

app.post('/api/watchlists', async (req, res) => {
  var sess: any = req.session;
  if (!(await isAuthenticated(sess.tokens as AccessToken))) {
    sess.tokens = undefined;
    res.status(403).send('user is not authenticated or session expired.');
  }

  console.log('Trader received: ' + JSON.stringify(req.body));
  const id = req.body.id as string;
  const name = req.body.name as string;
  const tickers = req.body.tickers as string[];
  const tokens = (req.session as any).tokens;
  const alpaca = new AlpacaClient(tokens);

  let output;
  if (id) {
    output = await alpaca.raw().updateWatchlist({
      uuid: id,
      name: name,
      symbols: tickers,
    });
  } else {
    output = await alpaca.raw().createWatchlist({
      name: name,
      symbols: tickers,
    });
  }

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(output));
});

async function isAuthenticated(accessToken: AccessToken) {
  console.log(accessToken);
  if (!accessToken) {
    return false;
  }
  const alpacaClient = new AlpacaClient(accessToken);
  let isAuth = await alpacaClient.isAuthenticated();
  if (!isAuth) {
    return false;
  }
  return true;
}

app.listen(port, () => console.log(`Server started on port ${port}...`));
