import express from 'express';
import session from 'express-session';
import path from 'path';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import {rootRouter} from './web/root';
import {watchlistsRouter} from './web/watchlists';
import {portfolioRouter} from './web/portfolio';
import {tradingbotRouter} from './web/tradingbot';
import {algoRepoRouter} from './web/algorepo';
import {loginRouter} from './web/login';
import {oauthRouter} from './web/oauth';
import {apisRouter} from './apis/apis';
import {
  authMiddleware,
  devEnvironmentMiddleware,
  loggerMiddleware,
  googleAnalyticsMiddleware,
  httpsMiddleware,
} from './common.middleware';
import {termsPrivacyRouter} from './web/terms-privacy';
import {errorMiddleware} from './error.middleware';
import {accountRouter} from './web/account';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(httpsMiddleware);
app.use(
  session({secret: 'ssshhhhhhhhhhhh', saveUninitialized: true, resave: true})
);
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(loggerMiddleware);
app.use(devEnvironmentMiddleware);
app.use(authMiddleware);
app.use(googleAnalyticsMiddleware);

app.use('/', rootRouter);
app.use('/watchlists', watchlistsRouter);
app.use('/portfolio', portfolioRouter);
app.use('/tradingbot', tradingbotRouter);
app.use('/account', accountRouter);
app.use('/algorepo', algoRepoRouter);
app.use('/login', loginRouter);
app.use('/oauth', oauthRouter);
app.use('/terms-and-privacy', termsPrivacyRouter);

/** APIs */
app.use('/api', apisRouter);

/** Error handling */
app.use(errorMiddleware);

app.listen(port, () => console.log(`Server started on port ${port}...`));
