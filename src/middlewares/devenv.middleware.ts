import {Router} from 'express';
import {isAuthenticated} from '../auth';
import {AccessToken} from '../trader';

const devEnvironmentMiddleware = Router();
devEnvironmentMiddleware.use(async (req, res, next) => {
  // if API key is explicitly passed, don't hardcode the token.
  if ((req.session as any).apikey !== undefined) {
    next();
  } else if (
    // If OAuth is not disabled, don't hardcode the token
    process.env.ALP_OAUTH_DISABLED !== 'true' &&
    // And ENV is dev
    process.env.ENV === 'dev' &&
    // And hardcoded token value is present
    process.env.ALP_HARDCODED_ACCESS_TOKEN
  ) {
    // Then only set the hardcoded token into the session
    (req.session as any).tokens = {
      access_token: process.env.ALP_HARDCODED_ACCESS_TOKEN,
      token_type: 'Bearer',
      scope: 'account:write trading',
    };
    console.log(
      'Using hardcoded accesstoken for dev environment - ' +
        (req.session as any).tokens.access_token
    );

    // also set the isAuth token based on the hardcoded token
    let isAuth = await isAuthenticated(
      (req.session as any).tokens as AccessToken,
      (req.session as any).liveMoney,
      (req.session as any).apikey,
      (req.session as any).apisecret
    );
    res.locals['isAuth'] = isAuth;
    next();
  } else {
    next();
  }
});

export {devEnvironmentMiddleware};
