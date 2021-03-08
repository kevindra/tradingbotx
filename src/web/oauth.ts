import express from 'express';
import request from 'request';
import {withTryCatchNext} from '../util';

const oauthRouter = express.Router();

oauthRouter.get('/', async (req, res, next) => {
  await withTryCatchNext(req, res, next, async (req, res, next) => {
    const code = req.query.code;
    let sess = req.session;

    if (!code) {
      res.send('Login denied!');
      return;
    }
    const url = 'https://api.alpaca.markets/oauth/token';
    const params = {
      grant_type: 'authorization_code',
      code: code,
      client_id: process.env.ALP_CLIENT_ID,
      client_secret: process.env.ALP_CLIENT_SECRET,
      redirect_uri: process.env.ALP_REDIRECT_URI,
    };

    return await new Promise((resolve, reject) => {
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
            resolve('');
          } else {
            const tokens = JSON.parse(body);
            (sess as any)['tokens'] = tokens;
            res.redirect('/login');
            resolve('');
          }
        }
      );
    });
  });
});

export {oauthRouter};
