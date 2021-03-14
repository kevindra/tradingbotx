import express, {Router} from 'express';
import {isAuthenticated} from '../auth';
import {AccessToken} from '../trader';
import {withTryCatchNext} from '../util';

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
      // always rely on the request header if using api key path
      (req.session as any).liveMoney = headers.livemoney === 'true';
    } else if (headers.accesstoken) {
      (req.session as any).tokens = {
        access_token: headers.accesstoken,
        token_type: 'Bearer',
        scope: 'account:write trading',
      };
      // Only update the livemoney flag in session if header was specified
      if (headers.livemoney !== undefined) {
        (req.session as any).liveMoney = headers.livemoney === 'true';
      }
      delete (req.session as any).apikey;
      delete (req.session as any).apisecret;
    } else {
      // keep session values as they are
      delete (req.session as any).apikey;
      delete (req.session as any).apisecret;
      // Only update the livemoney flag in session if header was specified
      if (headers.livemoney !== undefined) {
        (req.session as any).liveMoney = headers.livemoney === 'true';
      }
    }

    const isLiveMoney: boolean = (req.session as any).liveMoney;

    console.log(
      `Session tokens: ${sess.tokens}, liveMoney: ${isLiveMoney}, apiKey: ${
        (req.session as any).apikey
      }, apisecret: ${(req.session as any).apisecret}`
    );
    let isAuth = await isAuthenticated(
      sess.tokens as AccessToken,
      isLiveMoney,
      (req.session as any).apikey,
      (req.session as any).apisecret
    );
    res.locals['isAuth'] = isAuth;

    let pathRequiresAuth =
      excludedPathsFromAuthCheck.filter(p => p === req.path).length === 0;
    console.log(
      `Authentication Check: path ${
        req.path
      }, isAuth: ${isAuth}, isAuthRequired: ${pathRequiresAuth}, authToken: ${JSON.stringify(
        sess.tokens
      )}`
    );

    if (pathRequiresAuth && !isAuth) {
      if (req.path.startsWith('/api')) {
        sess.tokens = undefined;
        res.status(401).send(
          JSON.stringify({
            message: 'user is not authenticated or session expired.',
          })
        );
        return;
      }
    }
    next();
  });
});

export {authMiddleware};
