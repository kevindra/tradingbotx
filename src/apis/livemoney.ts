import express from 'express';

const liveMoneyRouter = express.Router();
liveMoneyRouter.get('/', (req, res) => {
  let sess: any = req.session;
  const liveMoney = req.query.v as string;
  if (liveMoney === 'true') {
    sess.liveMoney = true;
  } else {
    delete sess.liveMoney;
  }
  res.status(200).send(`Live money set to ${sess.liveMoney ? true : false}`);
});

export {liveMoneyRouter};
