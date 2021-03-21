import express from 'express';
import moment from 'moment-timezone';
import {
  MIN_INDICATOR_VALUE_DEFAULT,
  MAX_INDICATOR_VALUE_DEFAULT,
  MIN_TRADE_AMOUNT_DEFAULT,
  MAX_TRADE_AMOUNT_DEFAULT,
  LOOK_BACK_DAYS_DEFAULT,
  DATE_FORMAT,
  EST_TIMEZONE,
} from '../consts';
import {
  OpportunitiesFinder,
  Opportunity,
  OpportunityType,
} from '../OpportunitiesFinder';
import {SecurityTimeseriesManager} from '../SecurityTimeseriesManager';
import {getAlgosFromRequest, normalize, withTryCatchNext} from '../util';

const backtestApiRouter = express.Router();
const oppFinder = new OpportunitiesFinder();

export interface Portfolio {
  peakCost: number;
  totalCost: number;
  totalProfitLoss: number;
  totalProfitLossPct: number;
}

export interface BacktestResults {
  portfolio: Portfolio;
  positions: {[key: string]: Position};
  trades: Trade[];
}

export interface Position {
  qty: number;
  avgCost: number;
  // dailyProfitLoss: number; // can't do it for now
  profitLoss: number;
  totalCost: number;
  currentPrice: number;
}

export interface Trade {
  dayNum: number;
  timestamp: number;
  timestampStr: string;
  symbol: string;
  qty: number;
  price: number;
  avgCost: number;
  tradeProfitLoss: number;
  cummulativeProfitLoss: number;
  type: OpportunityType;
  indicatorValue: number;
  portfolioSnapshot: PortfolioSnapshot;
}

export interface PortfolioSnapshot {
  totalCost: number;
  profitLoss: number;
}

backtestApiRouter.get('/', async (req, res, next) => {
  await withTryCatchNext(req, res, next, async (req, res, next) => {
    // console.log(`Query Params: ${JSON.stringify(req.query, null, 2)}`);
    const flatTickers = (req.query.tickers as string) || '';
    let tickers: string[] = flatTickers.split(',');
    const horizon = parseInt(
      (req.query.horizon as string) || `${LOOK_BACK_DAYS_DEFAULT}`
    );
    // TODO - this is fine for now.. but we may need to evolve it to allow more query mechanisms
    const minIndicatorValue = parseFloat(
      (req.query.minIndicatorValue as string) ||
        `${MIN_INDICATOR_VALUE_DEFAULT}`
    );
    const maxIndicatorValue = parseFloat(
      (req.query.maxIndicatorValue as string) ||
        `${MAX_INDICATOR_VALUE_DEFAULT}`
    );
    const minTradeAmount = parseInt(
      (req.query.minTradeAmount as string) || `${MIN_TRADE_AMOUNT_DEFAULT}`
    );
    const maxTradeAmount = parseInt(
      (req.query.maxTradeAmount as string) || `${MAX_TRADE_AMOUNT_DEFAULT}`
    );
    // 30% of the initial price action is for learning the price pattern
    const trainingCoeff = parseFloat(
      (req.query.trainingCoeff as string) || '0.3'
    );
    // algo to run
    const algosToRun = getAlgosFromRequest(req);
    // indicator to use from the algo's output, 0-based TODO need algo based
    const indicator = 1; // getIndicatorFromRequest(req); // historical indicator
    let historicalOpportunitiesByAlgoId: {[key: string]: Opportunity[][]} = {};

    let endDate = moment().tz('America/Toronto');

    let positions: {[key: string]: Position} = {};
    let trades: Trade[] = [];
    let portfolio: Portfolio = {
      peakCost: 0,
      totalCost: 0,
      totalProfitLoss: 0,
      totalProfitLossPct: 0,
    };

    let flattenOpportunities: Opportunity[] = [];
    for (let aIndex in algosToRun) {
      // [stocksymbol][dayNum]
      const historicalOpportunities: Opportunity[][] = await oppFinder.findHistoricalOpportunities(
        tickers,
        horizon,
        endDate.clone(),
        algosToRun[aIndex],
        indicator,
        minIndicatorValue,
        maxIndicatorValue
      );
      historicalOpportunitiesByAlgoId[
        algosToRun[aIndex].id()
      ] = historicalOpportunities;

      // console.log(JSON.stringify(historicalOpportunities));
      // flatten the opportunities into:
      // date - ticker - type(buy,sell) etc..
      // so that it's easier to run trade logic on it
      historicalOpportunities.forEach((filteredOpp, symbolNum) => {
        filteredOpp.forEach(o => {
          flattenOpportunities.push(o);
        });
      });
    }

    // sort by date, in ascending order
    flattenOpportunities = flattenOpportunities.sort((a, b) => {
      return a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0;
    });

    const intervalCountBySymbols: {[key: string]: number} = {};
    tickers.forEach(t => {
      let minInterval = 100000;
      flattenOpportunities.forEach(o => {
        if (o.symbol === t) {
          minInterval = Math.min(minInterval, o.intervalNumber);
        }
      });

      let maxInterval = -1;
      flattenOpportunities.forEach(o => {
        if (o.symbol === t) {
          maxInterval = Math.max(maxInterval, o.intervalNumber);
        }
      });

      if (minInterval !== 100000 || maxInterval !== -1) {
        intervalCountBySymbols[t] = maxInterval - minInterval + 1;
      } else {
        intervalCountBySymbols[t] = 0;
      }
    });

    console.log(
      `Interval counts: ${JSON.stringify(intervalCountBySymbols, null, 2)}`
    );
    // console.log(`Total opportunities found: ${flattenOpportunities.length}`);
    // console.log(`Opps: ${JSON.stringify(flattenOpportunities)}`);

    const currentPrice: {[key: string]: number} = {};
    const tmManager = new SecurityTimeseriesManager();
    await Promise.all(
      tickers.map(async t => {
        const series = await tmManager.getStockTimeseries(
          t,
          horizon,
          endDate.clone()
        );
        if (series && series.prices && series.prices.length > 0) {
          currentPrice[t] = series.prices[series.prices.length - 1].close;
        }
      })
    );

    flattenOpportunities.forEach((o, index) => {
      const indicatorValue = o.indicatorValues[0]; // historical
      const s = o.symbol;
      const currPrice = o.price || 0;
      const type = o.type;
      const proposedTradeAmount = normalize(
        indicatorValue,
        minIndicatorValue,
        maxIndicatorValue,
        minTradeAmount,
        maxTradeAmount
      );
      // console.log(
      //   `${moment(o.timestamp).format(DATE_FORMAT)}: ${o.type} ${o.symbol}: ${
      //     o.indicatorValues[0]
      //   }, trade amount: $${proposedTradeAmount}, day number: ${oppNum}`
      // );

      if (
        o.intervalNumber < Math.floor(intervalCountBySymbols[s] * trainingCoeff)
      ) {
        // console.log(
        //   `No trade yet as this price pattern is used for learning the price pattern`
        // );
        return;
      }

      if (currPrice === 0) {
        return;
      }

      if (type === 'buy') {
        if (positions[s] === undefined) {
          positions[s] = {
            avgCost: 0,
            profitLoss: 0,
            qty: 0,
            totalCost: 0,
            currentPrice: currentPrice[s],
          };
        }

        // console.log(
        //   `${moment(o.timestamp).format(DATE_FORMAT)}: ${o.type} ${o.symbol}: ${
        //     o.indicatorValues[0]
        //   }, trade amount: $${proposedTradeAmount}, day number: ${oppNum}`
        // );

        let totalCost = positions[s].avgCost * positions[s].qty;
        let qtyToBuy = proposedTradeAmount / currPrice;
        let newTotalCost = totalCost + proposedTradeAmount;
        positions[s].qty = positions[s].qty + qtyToBuy;
        positions[s].avgCost = newTotalCost / positions[s].qty;
        positions[s].totalCost = newTotalCost;

        let totalPortfolioCost = 0;
        let totalProfitLoss = 0;
        Object.keys(positions).forEach(s => {
          totalPortfolioCost += positions[s].totalCost;
          totalProfitLoss += positions[s].profitLoss;
        });
        trades.push({
          dayNum: o.intervalNumber,
          timestamp: o.timestamp,
          timestampStr: moment(o.timestamp)
            .tz(EST_TIMEZONE)
            .format(DATE_FORMAT),
          symbol: s,
          price: currPrice,
          qty: qtyToBuy,
          type: type,
          avgCost: positions[s].avgCost,
          tradeProfitLoss: 0, // buy trades don't make any profit
          cummulativeProfitLoss: positions[s].profitLoss,
          portfolioSnapshot: {
            totalCost: totalPortfolioCost,
            profitLoss: totalProfitLoss,
          },
          indicatorValue: o.indicatorValues[0],
        });
      } else {
        let qtyToSell = proposedTradeAmount / currPrice;
        // can only sell if we own more qty than we are selling
        if (positions[s] && positions[s].qty >= qtyToSell) {
          // console.log(
          //   `${moment(o.timestamp).format(DATE_FORMAT)}: ${o.type} ${
          //     o.symbol
          //   }: ${
          //     o.indicatorValues[0]
          //   }, trade amount: $${proposedTradeAmount}, day number: ${oppNum}`
          // );

          const tradeProfitLoss =
            qtyToSell * (currPrice - positions[s].avgCost);
          positions[s].profitLoss += tradeProfitLoss;
          positions[s].qty = positions[s].qty - qtyToSell;
          positions[s].totalCost = positions[s].qty * positions[s].avgCost;

          let totalPortfolioCost = 0;
          let totalProfitLoss = 0;
          Object.keys(positions).forEach(s => {
            totalPortfolioCost += positions[s].totalCost;
            totalProfitLoss += positions[s].profitLoss;
          });

          trades.push({
            dayNum: index,
            timestamp: o.timestamp,
            timestampStr: moment(o.timestamp)
              .tz(EST_TIMEZONE)
              .format(DATE_FORMAT),
            symbol: s,
            price: currPrice,
            qty: qtyToSell,
            type: type,
            avgCost: positions[s].avgCost,
            tradeProfitLoss: tradeProfitLoss,
            cummulativeProfitLoss: positions[s].profitLoss,
            indicatorValue: o.indicatorValues[0],
            portfolioSnapshot: {
              totalCost: totalPortfolioCost,
              profitLoss: totalProfitLoss,
            },
          });
        }
      }
      let totalCost = 0;
      Object.keys(positions).forEach(s => {
        totalCost += positions[s].totalCost;
      });
      portfolio.peakCost = Math.max(portfolio.peakCost, totalCost);
    });

    if (Object.keys(positions).length > 0) {
      Object.keys(positions).forEach(s => {
        portfolio.totalCost += positions[s].totalCost;
        portfolio.totalProfitLoss += positions[s].profitLoss;
      });
      portfolio.totalProfitLossPct =
        portfolio.totalProfitLoss / portfolio.totalCost;
    }

    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        portfolio,
        positions,
        trades,
      } as BacktestResults)
    );
  });
});

export {backtestApiRouter};
