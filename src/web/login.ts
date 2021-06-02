import express from 'express';
import {NAV_TITLE, SECONDARY_TITLE} from '../consts';
const loginRouter = express.Router();

loginRouter.get('/', (req, res) => {
  res.render('login', {
    title: 'TradingBotX | Login',
    navTitle: NAV_TITLE,
    message: SECONDARY_TITLE,
    clientId: process.env.ALP_CLIENT_ID,
    secret: process.env.ALP_CLIENT_SECRET,
    redirectUri: process.env.ALP_REDIRECT_URI,
    isAuth: res.locals['isAuth'],
    liveMoneyToggle: (req.session as any).liveMoney === true ? 'checked' : '',
  });
});

export {loginRouter};
