import {Watchlist} from '@master-chief/alpaca';
import express from 'express';
import request from 'request';
import {getAllAlgoIds, getAllAlgoNames} from '../algo/algoregistry';
import {AlpacaClient} from '../client/AlpacaClient';
import {NAV_TITLE} from '../consts';
import {withTryCatchNext} from '../util';
const automationRouter = express.Router();
export interface Rule {
  arn: string;
  schedule: string;
  state: string;
  name: string;
  paper: boolean;
}
automationRouter.get('/create', (req, res) => {
  var sess: any = req.session;

  console.log(JSON.stringify(sess, null, 2));
  console.log(sess.tokens.access_token);
  res.render('automation', {
    title: 'TradingBotX | Automated Trades',
    navTitle: NAV_TITLE,
    message: 'Create a New Automated Trade',
    secondaryMessage:
      'Here you can create automatic schedule for bot to buy or sell your list of stocks based on the algorithm output you choose, completely hands free.',
    isAuth: res.locals['isAuth'],
    create: true,
    algoIds: getAllAlgoIds(),
    algoNames: getAllAlgoNames(),
    showApiKeyField: process.env.ENV !== 'prod',
    accesstoken: sess.tokens ? sess.tokens.access_token : undefined,
    paper: sess.liveMoney !== true,
    tbotxApiEndpoint: process.env.TBOTX_API_ENDPOINT
  });
});

// scheduleRouter.get('/edit', async (req, res, next) => {
//   await withTryCatchNext(req, res, next, async (req, res, next) => {
//     var sess: any = req.session;
//     const id = req.query.id as string;
//     const isLiveMoney: boolean = (req.session as any).liveMoney;
//     const alpaca = new AlpacaClient(
//       sess.tokens,
//       isLiveMoney,
//       (req.session as any).apikey,
//       (req.session as any).apisecret
//     );
//     const watchlist = await alpaca.raw().getWatchlist({
//       uuid: id,
//     });

//     res.render('watchlists', {
//       title: 'TradingBotX | Watchlists',
//       navTitle: NAV_TITLE,
//       message: 'Edit your watchlist',
//       secondaryMessage:
//         'Here, you can manage your watchlists for your favorite stocks and use them as inputs to the algorithms.',
//       isAuth: res.locals['isAuth'],
//       edit: true,
//       name: watchlist.name,
//       tickers: watchlist.assets
//         .map(a => {
//           return a.symbol;
//         })
//         .join(','),
//       id: watchlist.id,
//     });
//   });
// });

automationRouter.get('/', async (req, res, next) => {
  await withTryCatchNext(req, res, next, async (req, res, next) => {
    var sess: any = req.session;
    let watchlists: Watchlist[] = [];

    if (res.locals['isAuth']) {
      const id = req.query.id as string; // rule id
      const tokens = (req.session as any).tokens;
      const isLiveMoney: boolean = (req.session as any).liveMoney;

      const headers = {
        'Content-Type': 'application/json',
        apikey: (req.session as any).apikey,
        apisecret: (req.session as any).apisecret,
        Authorization: `Bearer ${
          (req.session as any).tokens &&
          (req.session as any).tokens.access_token
        }`,
      };

      let url = process.env.TBOTX_API_ENDPOINT || '';
      if (id) {
        url += '?ruleArn=' + id;
      }

      console.log('hitting url: ' + url);
      const rules: Rule[] = await new Promise((resolve, reject) => {
        request.get(
          url,
          {
            headers,
          },
          (err, res, body) => {
            if (err) {
              console.log(`Error: ${err}`);
              reject(err);
              return;
            }

            console.log(res.statusCode);
            console.log(body);
            resolve(JSON.parse(body).rules as Rule[]);
          }
        );
      });

      res.render('automation', {
        title: 'TradingBotX | Automated Trades',
        navTitle: NAV_TITLE,
        message: 'List of all your automated trades.',
        secondaryMessage:
          'Here, you can see all your currently scheduled automated trades.',
        isAuth: res.locals['isAuth'],
        list: true,
        rules: rules,
      });
    } else {
      res.render('automation', {
        title: 'TradingBotX | Automated Trades',
        navTitle: NAV_TITLE,
        message: 'List of all your automated trades.',
        secondaryMessage:
          'Here, you can see all your currently scheduled automated trades.',
        isAuth: res.locals['isAuth'],
        list: true,
      });
    }
  });
});

export {automationRouter};
