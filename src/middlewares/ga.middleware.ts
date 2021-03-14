import {Router} from 'express';
import fetch from 'node-fetch';
import queryString from 'query-string';
import {GA_TRACKING_ID} from '../consts';

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

export {googleAnalyticsMiddleware};
