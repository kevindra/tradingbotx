import express, {query, Router} from 'express';
import {isAuthenticated} from './auth';
import {AccessToken} from './trader';
import fetch, {RequestInit} from 'node-fetch';
import {GA_TRACKING_ID} from './consts';
import queryString from 'query-string';
import {withTryCatchNext} from './util';

const authMiddleware = express.Router();
authMiddleware.use(async (req, res, next) => {
  await withTryCatchNext(req, res, next, async (req, res, next) => {
    const excludedPathsFromAuthCheck = [
      '/api/indicators/current',
      '/api/opportunities',
      '/api/indicators/history',
      '/',
      '/portfolio',
      '/login',
    ];

    let sess: any = req.session;
    const headers = req.headers;

    // Clients can set the access keys in the request header as well
    if (headers.apikey) {
      (req.session as any).apikey = headers.apikey;
      (req.session as any).apisecret = headers.apisecret;
      (req.session as any).liveMoney = headers.livemoney;
    } else if (headers.accessToken) {
      (req.session as any).tokens = {
        access_token: headers.accessToken,
        token_type: 'Bearer',
        scope: 'account:write trading',
      };
    }

    const isLiveMoney: boolean = (req.session as any).liveMoney;

    let isAuth = await isAuthenticated(sess.tokens as AccessToken, isLiveMoney, (req.session as any).apikey, (req.session as any).apisecret);
    res.locals['isAuth'] = isAuth;

    let pathRequiresAuth =
      excludedPathsFromAuthCheck.filter(p => p === req.path).length === 0;
    console.log(
      `Authentication check, path ${
        req.path
      }, isAuth: ${isAuth}, isAuthRequired: ${pathRequiresAuth}, authToken: ${JSON.stringify(
        sess.tokens
      )}`
    );

    if (pathRequiresAuth && !isAuth) {
      if (req.path.startsWith('/api')) {
        sess.tokens = undefined;
        res.status(403).send('user is not authenticated or session expired.');
      }
    }
    next();
  });
});

const loggerMiddleware = Router();
loggerMiddleware.use((req, res, next) => {
  console.log(`env: ${process.env.ENV}`);
  console.log(
    `${req.method}: ${req.url} query: ${JSON.stringify(
      req.query
    )} body: ${JSON.stringify(req.body)}, header: ${JSON.stringify(
      req.headers
    )}`
  );
  next();
});

const devEnvironmentMiddleware = Router();
devEnvironmentMiddleware.use((req, res, next) => {
  // If OAuth is not enabled, don't hardcode the token
  if (
    process.env.ALP_OAUTH_DISABLED !== 'true' &&
    process.env.ENV === 'dev' &&
    process.env.ALP_HARDCODED_ACCESS_TOKEN
  ) {
    (req.session as any).tokens = {
      access_token: process.env.ALP_HARDCODED_ACCESS_TOKEN,
      token_type: 'Bearer',
      scope: 'account:write trading',
    };
    console.log(
      'Using hardcoded accesstoken for dev environment - ' +
        (req.session as any).tokens.access_token
    );
  }
  next();
});

const googleAnalyticsMiddleware = Router();
googleAnalyticsMiddleware.use((req, res, next) => {
  if (process.env.ENV !== 'prod') {
    next();
    return;
  }

  const params = {
    // API Version.
    v: '1',
    // Tracking ID / Property ID.
    tid: GA_TRACKING_ID,
    // Anonymous Client Identifier. Ideally, this should be a UUID that
    // is associated with particular user, device, or browser instance.
    cid: `${req.session ? req.session.id : 'no-session'}`,
    // Event hit type.
    t: 'event',

    // Event category.
    ec: `${req.url}`,
    // Event action.
    ea: `${req.method}`,
    // Event label.
    el: `${process.env.ENV}`,
    // Event value.
    ev: `${1}`,
  };

  console.log(
    `http://www.google-analytics.com/collect?` + queryString.stringify(params)
  );
  fetch(
    'http://www.google-analytics.com/collect?' + queryString.stringify(params),
    {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.192 Safari/537.36',
      },
    }
  );
  // don't wait for logging or any error in logging
  next();
});

const httpsMiddleware = Router();
httpsMiddleware.use((req, res, next) => {
  if (process.env.ENV === 'prod') {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  } else {
    next();
  }
});

export {
  authMiddleware,
  loggerMiddleware,
  devEnvironmentMiddleware,
  googleAnalyticsMiddleware,
  httpsMiddleware,
};
