import {Router} from 'express';

const loggerMiddleware = Router();
loggerMiddleware.use((req, res, next) => {
  console.log(`env: ${process.env.ENV}`);
  console.log(
    `${req.method}: ${req.url} query: ${JSON.stringify(
      req.query
    )} body: ${JSON.stringify(req.body)}, headers: ${JSON.stringify(
      req.headers
    )}`
  );
  next();
});

export {loggerMiddleware};
