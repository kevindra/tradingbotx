import express from 'express';
import session from 'express-session';
import path from 'path';
import {ConfidenceCalculator} from './ConfidenceCalculator';
import {Trader} from './trader';
import {SecurityType} from './types';
import dotenv from 'dotenv';
import {Opportunities, OpportunitiesFinder} from './OpportunitiesFinder';
import popularTickers = require('./popularTickers.json');
import bodyParser from 'body-parser';
import request from 'request';
import {ESRCH} from 'constants';

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
  });
});

app.get('/portfolio', (req, res) => {
  res.render('portfolio', {
    title: 'Buy The Dip Club | Portfolio Analysis',
    navTitle: NAV_TITLE,
    message: SECONDARY_TITLE,
    secondaryMessage:
      'This app analyzes the past price pattern of the ticker and calculates the confidence to buy. It depends on variety of factors but the most important one is the momentum speed.',
    ticker: req.query.t,
    tickerType: req.query.type,
    horizon: req.query.h,
  });
});

app.get('/tradingbot', (req, res) => {
  res.render('tradingbot', {
    title: 'Buy The Dip Club | Trading Bot',
    navTitle: NAV_TITLE,
    message: SECONDARY_TITLE,
  });
});

app.get('/login', (req, res) => {
  var sess: any = req.session;
  if (sess.tokens) {
    res.send('Already logged in : ' + JSON.stringify(sess.tokens));
  } else {
    res.render('login', {
      title: 'Buy The Dip Club | Login',
      navTitle: NAV_TITLE,
      message: SECONDARY_TITLE,
      clientId: process.env.ALP_CLIENT_ID,
      secret: process.env.ALP_CLIENT_SECRET,
      redirectUri: process.env.ALP_REDIRECT_URI,
    });
  }
});

app.get('/oauth', async (req, res) => {
  const code = req.query.code;
  let sess = req.session;

  if (!code) {
    res.send('Login denied!');
    // res.redirect('/login');
    return;
  }
  // POST https://api.alpaca.markets/oauth/token

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
          res.send('Login successful!');
          // res.redirect('/login');
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
  console.log('Trader received: ' + JSON.stringify(req.body));

  const opp = req.body.opp as Opportunities;
  const alpAccessKey = req.body.alp_access_key;
  const alpSecretKey = req.body.alp_secret_key;

  const trader = new Trader(alpAccessKey, alpSecretKey);
  const orders = await trader.performTrades(opp, alpAccessKey, alpSecretKey);

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({orders}));
});

app.listen(port, () => console.log(`Server started on port ${port}...`));
