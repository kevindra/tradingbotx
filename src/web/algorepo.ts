import express from 'express';
import {NAV_TITLE} from '../consts';
import Markdown from 'markdown-it';
import request from 'request';

const router = express.Router();
const mkd = new Markdown();

router.get('/', async (req, res) => {
  let markdownContent: string = await new Promise((resolve, reject) => {
    request.get(
      'https://raw.githubusercontent.com/kevindra/tradingbot/main/src/algo/README.md',
      (err, res, body) => {
        resolve(body);
      }
    );
  });
  res.render('algorepo', {
    title: 'TradingBotX | Algorithms',
    navTitle: NAV_TITLE,
    message: 'Algorithms',
    secondaryMessage: 'Following are the current algorithms and how they work.',
    markdownHtml: mkd.render(markdownContent),
    isAuth: res.locals['isAuth'],
  });
});

export {router as algoRepoRouter};
