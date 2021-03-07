import express, {Router} from 'express';
import {isAuthenticated} from './auth';
import {AccessToken} from './trader';

const authMiddleware = express.Router();
authMiddleware.use(async (req, res, next) => {
  const excludedPathsFromAuthCheck = [
    '/api/conf',
    '/api/opportunities',
    '/api/latestconf',
    '/',
    '/portfolio',
    '/login',
  ];

  let sess: any = req.session;
  let isAuth = await isAuthenticated(sess.tokens as AccessToken);
  res.locals['isAuth'] = isAuth;

  let pathRequiresAuth =
    excludedPathsFromAuthCheck.filter(p => p === req.path).length === 0;
  console.log(
    `Authentication check, path ${req.path}, isAuth: ${isAuth}, isAuthRequired: ${pathRequiresAuth}`
  );

  if (pathRequiresAuth && !isAuth) {
    if (req.path.startsWith('/api')) {
      sess.tokens = undefined;
      res.status(403).send('user is not authenticated or session expired.');
    }
  }
  next();
});

const loggerMiddleware = Router();
loggerMiddleware.use(async (req, res, next) => {
  console.log(`env: ${process.env.ENV}`);
  console.log(
    `${req.method}: ${req.url} query: ${JSON.stringify(
      req.query
    )} body: ${JSON.stringify(req.body)}`
  );
  next();
});

const devEnvironmentMiddleware = Router();
devEnvironmentMiddleware.use((req, res, next) => {
  if (process.env.ENV === 'dev') {
    (req.session as any).tokens = {
      access_token: 'd6d2a08d-b9c5-4b3e-96e9-6e021a0c52a2',
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

export {authMiddleware, loggerMiddleware, devEnvironmentMiddleware};
