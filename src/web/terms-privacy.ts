import express from 'express';
import {NAV_TITLE, SECONDARY_TITLE} from '../consts';
const termsPrivacyRouter = express.Router();

termsPrivacyRouter.use('/', (req, res) => {
  res.render('terms-and-privacy', {
    title: 'Buy The Dip Club | Trading Bot',
    navTitle: NAV_TITLE,
    message: SECONDARY_TITLE,
    isAuth: res.locals['isAuth'],
  });
});

export {termsPrivacyRouter};
