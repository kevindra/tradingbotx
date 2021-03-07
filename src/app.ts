import express from 'express';
import session from 'express-session';
import path from 'path';
import dotenv from 'dotenv';
import {OpportunitiesFinder} from './OpportunitiesFinder';
import bodyParser from 'body-parser';
import {rootRouter} from './web/root';
import {watchlistsRouter} from './web/watchlists';
import {portfolioRouter} from './web/portfolio';
import {tradingbotRouter} from './web/tradingbot';
import {loginRouter} from './web/login';
import {oauthRouter} from './web/oauth';
import {apisRouter} from './apis/apis';
import {AccessToken} from './trader';
import {isAuthenticated} from './auth';
import {
  authMiddleware,
  devEnvironmentMiddleware,
  loggerMiddleware,
  googleAnalyticsMiddleware,
} from './common';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
app.use(
  session({secret: 'ssshhhhhhhhhhhh', saveUninitialized: true, resave: true})
);
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(authMiddleware);
app.use(loggerMiddleware);
app.use(devEnvironmentMiddleware);
app.use(googleAnalyticsMiddleware);

app.use('/', rootRouter);
app.use('/watchlists', watchlistsRouter);
app.use('/portfolio', portfolioRouter);
app.use('/tradingbot', tradingbotRouter);
app.use('/login', loginRouter);
app.use('/oauth', oauthRouter);

/** APIs */
app.use('/api', apisRouter);

app.listen(port, () => console.log(`Server started on port ${port}...`));
