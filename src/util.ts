import {Order} from '@master-chief/alpaca';
import {Request, Response, NextFunction} from 'express';
import moment, {Moment} from 'moment';
import {ALGO_REGISTRY, getAlgoById} from './algo/algoregistry';
import {AlpacaClient} from './client/AlpacaClient';

/**
 * A generic function to catch all exceptions for the input function and route them to express's next function
 */
export const withTryCatchNext = async (
  req: Request,
  res: Response,
  next: NextFunction,
  func: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  try {
    await func(req, res, next);
  } catch (err) {
    console.log(`Error occurred: ${err} ${err.stack}`);
    next(err);
  }
};

export const getAlgosFromRequest = (req: Request) => {
  const algoIds: string[] = (
    (req.query.algoIds as string) || ALGO_REGISTRY[0].id()
  ).split(',');

  const algosToRun = algoIds.map(a => {
    const algo = getAlgoById(a);
    if (!algo) throw new Error(`Invalid algo name ${a}`);
    return algo;
  });

  return algosToRun;
};

export const getAlgoFromRequest = (req: Request) => {
  const algoId: string = (req.query.algoId as string) || ALGO_REGISTRY[0].id();

  const algo = getAlgoById(algoId);
  if (!algo) throw new Error(`Invalid algo name ${algoId}`);
  return algo;
};

export const getIndicatorFromRequest = (req: Request) => {
  return parseInt((req.query.indicator as string) || '0');
};

export const getDateTimeInEST = (datetime: string, format: string) => {
  return moment(datetime, format).tz('America/Toronto');
};

export const getMomentInEST = (moment: Moment) => {
  return moment.tz('America/Toronto');
};

// old = indicator value (original range of x)
// new = tradeAmount (new range of x)
// normalizes a number from old range to a new range (for ex - from indicator value range to trade amount range)
export const normalize = (
  x: number,
  oldMin: number,
  oldMax: number,
  newMin: number,
  newMax: number
) => {
  let weightedX =
    newMin + ((x - oldMin) * (newMax - newMin)) / (oldMax - oldMin);
  return Math.floor(weightedX);
};

export function calculateRealizedPl(
  symbol: string,
  avg_entry_price: number,
  orders: Order[]
) {
  const symbolOrders = orders.filter(o => {
    return o.symbol === symbol;
  });
  let totalRealizedProfitloss = 0;
  // TODO: there will be a discrepancy in this logic
  // because the total PL calculation depends on the "avg_entry_price"
  // which may change if after selling a certain stock
  // bots starts to buy it again which will update the avg_entry_price
  // leading to wrong total_pl calculation.
  // we need to track the PL at the order time and/or at each end of day.
  symbolOrders.forEach(o => {
    if (o.side === 'sell') {
      totalRealizedProfitloss +=
        (o.filled_avg_price - avg_entry_price) * o.filled_qty;
      // console.log(
      //   `${o.symbol} filled price: ${o.filled_avg_price}, avg entry: ${avg_entry_price}, qty: ${o.filled_qty}, realized pl: ${totalRealizedProfitloss}`
      // );
    }
  });
  return totalRealizedProfitloss;
}

export async function getAllOrders(alpaca: AlpacaClient) {
  // Iterate and get all orders
  const allOrders: Order[] = [];
  let moreOrdersExist = true;
  let startDateOffset = 7; // 7 days window
  let endDateOffset = 0;
  while (moreOrdersExist === true) {
    const orders = await alpaca.raw().getOrders({
      status: 'all',
      limit: 500, // max order length supported by alpaca
      after: new Date(startDateOffset * 24 * 60 * 60 * 1000),
      until:
        endDateOffset !== 0
          ? new Date(endDateOffset * 24 * 60 * 60 * 1000)
          : new Date(),
    });
    startDateOffset += 7;
    endDateOffset += 7; // 7 days window

    if (orders === undefined || orders.length === 0) {
      moreOrdersExist = false;
    } else {
      allOrders.push(...orders);
    }
  }
  return allOrders;
}
