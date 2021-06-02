import {Position, Watchlist} from '@master-chief/alpaca';
import express from 'express';
import moment from 'moment';
import {AlpacaClient} from '../client/AlpacaClient';
import {NAV_TITLE} from '../consts';
import {withTryCatchNext} from '../util';
const accountRouter = express.Router();

accountRouter.get('/', async (req, res, next) => {
  await withTryCatchNext(req, res, next, async (req, res, next) => {
    var sess: any = req.session;
    const isLiveMoney: boolean = sess.liveMoney;
    const alpaca = new AlpacaClient(
      sess.tokens,
      isLiveMoney,
      (req.session as any).apikey,
      (req.session as any).apisecret
    );
    const account = await alpaca.raw().getAccount();
    const positions = await alpaca.raw().getPositions();
    const orders = await alpaca.raw().getOrders({
      status: 'all',
    });

    const buying_power = `$${(
      Math.round(account.buying_power * 100) / 100
    ).toFixed(2)}`;
    const equity = `$${(Math.round(account.equity * 100) / 100).toFixed(2)}`;
    const cash = `$${(Math.round(account.cash * 100) / 100).toFixed(2)}`;

    const formattedPositions: any[] = [];
    // total positions summary
    const posSum: any = {
      totalCost: 0,
      totalProfit: 0,
      todayProfit: 0,
      totalProfitPc: 0,
      todayProfitPc: 0,
      mktValue: 0,
      formatted: {
        totalCost: 0,
        totalProfit: 0,
        todayProfit: 0,
        totalProfitPc: 0,
        todayProfitPc: 0,
        mktValue: 0,
      },
    };
    positions.forEach(p => {
      formattedPositions.push({
        symbol: p.symbol,
        current_price: `$${p.current_price}`,
        change_today: formatAndColor(p.change_today * 100, 'pct'),
        qty: `${p.qty.toFixed(2)}`,
        market_value: `$${p.market_value.toFixed(2)}`,
        avg_entry_price: `$${p.avg_entry_price.toFixed(2)}`,
        cost_basis: `$${p.cost_basis.toFixed(2)}`,
        unrealized_pl: formatAndColor(p.unrealized_pl, 'dollar'),
        unrealized_plpc: formatAndColor(p.unrealized_plpc * 100, 'pct'),
        unrealized_intraday_pl: formatAndColor(
          p.unrealized_intraday_pl,
          'dollar'
        ),
        unrealized_intraday_plpc: formatAndColor(
          p.unrealized_intraday_plpc * 100,
          'pct'
        ),
      });

      posSum.totalCost += p.cost_basis;
      posSum.formatted.totalCost = `$${posSum.totalCost.toFixed(2)}`;
      posSum.totalProfit += p.unrealized_pl;
      posSum.formatted.totalProfit = formatAndColor(
        posSum.totalProfit,
        'dollar'
      );
      posSum.todayProfit += p.unrealized_intraday_pl;
      posSum.formatted.todayProfit = formatAndColor(
        posSum.todayProfit,
        'dollar'
      );
      posSum.todayProfitPc = (posSum.todayProfit / posSum.totalCost) * 100;
      posSum.formatted.todayProfitPc = formatAndColor(
        posSum.todayProfitPc,
        'pct'
      );
      posSum.totalProfitPc = (posSum.totalProfit / posSum.totalCost) * 100;
      posSum.formatted.totalProfitPc = formatAndColor(
        posSum.totalProfitPc,
        'pct'
      );
      posSum.mktValue += p.market_value;
      posSum.formatted.mktValue = `$${posSum.mktValue.toFixed(2)}`;
    });

    const formattedOrders: any[] = [];

    orders.forEach(o => {
      formattedOrders.push({
        symbol: o.symbol,
        qty: o.qty ? o.qty.toFixed(2) : ' ',
        filled_qty: o.filled_qty.toFixed(2),
        side: o.side,
        type: o.type,
        time_in_force: o.time_in_force,
        filled_avg_price: o.filled_avg_price ? o.filled_avg_price : '-',
        status: o.status,
        submitted_at: moment(o.submitted_at).format('MM/DD/YYYY h:mm a z'),
        filled_at: o.filled_at,
        canceled_at: o.canceled_at,
        replaced_at: o.replaced_at,
      });
    });

    res.render('account', {
      title: 'TradingBotX | Account',
      navTitle: NAV_TITLE,
      message: 'My Account',
      secondaryMessage: 'Here, you can see your account details',
      isAuth: res.locals['isAuth'],
      liveMoneyToggle: sess.liveMoney === true ? 'checked' : '',
      account: account,
      buying_power: buying_power,
      cash: cash,
      equity: equity,
      positions: formattedPositions,
      positionsSummary: posSum,
      orders: formattedOrders,
    });
  });
});

export function formatAndColor(num: number, type: 'dollar' | 'pct') {
  return num < 0
    ? `<span class='text-danger'>${format(num, type)}</span>`
    : `<span class='text-success'>${format(num, type)}</span>`;
}

export function format(
  num: number,
  type: 'dollar' | 'pct',
  withSign: boolean = true
) {
  const sign = withSign ? '+' : '';
  if (type === 'dollar') {
    return num > 0 ? `${sign}$${num.toFixed(2)}` : `$${num.toFixed(2)}`;
  } else {
    return num > 0 ? `${sign}${num.toFixed(2)}%` : `${num.toFixed(2)}%`;
  }
}
export {accountRouter};
