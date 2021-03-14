import {Router} from 'express';

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

export {httpsMiddleware};
