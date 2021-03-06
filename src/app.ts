import express from 'express';
import path from 'path';
import {ConfidenceCalculator} from './ConfidenceCalculator';
import {SecurityType} from './types';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const NAV_TITLE = 'Buy The Dip Club';
const SECONDARY_TITLE = 'Stock/Crypto Buy Predictor';
const confidenceCalculator = new ConfidenceCalculator();

app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.get('/', (req, res) => {
  res.render('index', {
    title: 'Buy The Dip Club | Quick Analysis',
    navTitle: NAV_TITLE,
    message: SECONDARY_TITLE,
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
    ticker: req.query.t,
    tickerType: req.query.type,
    horizon: req.query.h,
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

app.listen(port, () => console.log(`Server started on port ${port}...`));
