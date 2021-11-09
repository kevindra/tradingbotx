import Bottleneck from 'bottleneck';
import moment, { Moment } from 'moment-timezone';

import { Algo } from './algo/algo';
import { AlgoExecutor, AlgosResponse } from './AlgoExecutor';
import { SecurityTimeseriesAdapter } from './SecurityTimeseriesAdapter';
import { SecurityTimeseriesManager } from './SecurityTimeseriesManager';

export interface Opportunity {
  symbol: string;
  indicatorValues: number[];
  price?: number;
  // type: OpportunityType;
  intervalNumber: number;
  timestamp: number;
}

// export type OpportunityType = 'buy' | 'sell';

export interface Opportunities {
  opportunities: Opportunity[];
}

const algoExecutor = new AlgoExecutor();
const timeseriesManager = new SecurityTimeseriesManager();

export class OpportunitiesFinder {
  constructor() {}

  async findHistoricalOpportunities(
    symbols: string[],
    horizon: number,
    endDate: Moment,
    algo: Algo,
    indicatorIndex: number,
    minIndicatorValue: number,
    maxIndicatorValue: number
  ) {
    // 75 requests per 1 minute
    // api allows 5 requests per minute, 500 per day
    const limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 10,
    });

    const allSymbolsDailyOpportunities = await Promise.all(
      symbols.map(async symbol => {
        const conf = await limiter.schedule(
          async () =>
            await algoExecutor.executeAlgoOnStock(symbol, horizon, endDate, [
              algo,
            ])
        );

        let opps: Opportunity[] = [];
        if (conf.timestamps && conf.timestamps.length > 0) {
          opps = conf.timestamps.map((c, i) => {
            return <Opportunity>{
              symbol: symbol,
              indicatorValues: [
                // always returning the requested indicator.. multi indicator support is not yet present
                conf.timestamps[i].algoOutputs[0][indicatorIndex],
              ],
              price: conf.timestamps[i].price,
              // type: algo.actionType(),
              intervalNumber: i + 1,
              timestamp: conf.timestamps[i].timestamp,
            };
          });
        } else {
          opps = [
            <Opportunity>{
              symbol: symbol,
              indicatorValues: [],
              // type: algo.actionType(),
              intervalNumber: -1,
              timestamp: -1,
            },
          ];
        }

        return {
          symbol: symbol,
          opp: opps,
        };
      })
    );

    // console.log(
    //   `All symbols daily opps: ${JSON.stringify(
    //     allSymbolsDailyOpportunities,
    //     null,
    //     2
    //   )}`
    // );

    const filteredOpportunities: Opportunity[][] = allSymbolsDailyOpportunities.map(
      perSymbolDailyOpportunities => {
        return perSymbolDailyOpportunities.opp
          .filter(
            o =>
              o.indicatorValues.length > 0 &&
              o.indicatorValues[0] >= minIndicatorValue
          )
          .filter(
            o =>
              o.indicatorValues.length > 0 &&
              o.indicatorValues[0] <= maxIndicatorValue
          )
          .sort((a, b) =>
            a.indicatorValues.length > 0 &&
            b.indicatorValues.length > 0 &&
            a.indicatorValues[0] < b.indicatorValues[0]
              ? 1
              : a.indicatorValues[0] > b.indicatorValues[0]
              ? -1
              : 0
          );
      }
    );

    return filteredOpportunities; // daily opportunities
  }

  async findOpportunities(
    symbols: string[],
    horizon: number,
    endDate: Moment,
    algo: Algo,
    indicatorIndex: number,
    minIndicatorValue: number,
    maxIndicatorValue: number
  ) {
    // 75 requests per 1 minute
    // api allows 5 requests per minute, 500 per day
    const limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 10,
    });

    const allOpportunities = await Promise.all(
      symbols.map(async symbol => {
        const conf = await limiter.schedule(
          async () =>
            await algoExecutor.executeAlgoOnStock(symbol, horizon, endDate, [
              algo,
            ])
        );

        if (conf.timestamps && conf.timestamps.length > 0) {
          return <Opportunity>{
            symbol: symbol,
            indicatorValues: [
              // always returning the requested indicator.. multi indicator support is not yet present
              conf.timestamps[conf.timestamps.length - 1].algoOutputs[0][
                indicatorIndex
              ],
            ],
            price: conf.timestamps[conf.timestamps.length - 1].price,
            // type: algo.actionType(),
            intervalNumber: conf.timestamps.length,
            timestamp: conf.timestamps[conf.timestamps.length - 1].timestamp,
          };
        } else {
          return <Opportunity>{
            symbol: symbol,
            indicatorValues: [],
            // type: algo.actionType(),
            intervalNumber: -1,
            timestamp: -1,
          };
        }
      })
    );

    const filteredOpportunities: Opportunity[] = allOpportunities
      .filter(
        o =>
          o.indicatorValues.length > 0 &&
          o.indicatorValues[0] >= minIndicatorValue
      )
      .filter(
        o =>
          o.indicatorValues.length > 0 &&
          o.indicatorValues[0] <= maxIndicatorValue
      )
      .sort((a, b) =>
        a.indicatorValues.length > 0 &&
        b.indicatorValues.length > 0 &&
        a.indicatorValues[0] < b.indicatorValues[0]
          ? 1
          : a.indicatorValues[0] > b.indicatorValues[0]
          ? -1
          : 0
      );
    console.log(
      `Filtered opportunities ${JSON.stringify(filteredOpportunities, null, 2)}`
    );
    return <Opportunities>{
      opportunities: filteredOpportunities,
    };
  }
}

/**
 * Finds the current latest opportunity for a stock symbol
 * @param ticker
 * @param horizon
 * @param endDate
 * @param algo
 * @param indicatorIndex
 * @returns
 */
export const getCurrentOpportunity = async (
  ticker: string,
  horizon: number,
  endDate: Moment,
  algo: Algo
): Promise<Opportunity> => {
  const stockData = await timeseriesManager.getStockTimeseries(
    ticker,
    horizon,
    endDate
  );

  // No data found for the stock ticker
  if (stockData.prices === undefined || stockData.prices.length === 0) {
    return <Opportunity>{
      symbol: ticker,
      indicatorValues: [],
      // type: algo.actionType(),
      intervalNumber: -1,
      timestamp: -1,
    };
  }

  const algoOutput = await algoExecutor.execute(
    stockData,
    [algo],
    0,
    stockData.prices.length
  );

  const currentOpportunity = <Opportunity>{
    symbol: ticker,
    indicatorValues:
      // algoOutputs[0] because we executed only one algo
      algoOutput.timestamps[algoOutput.timestamps.length - 1].algoOutputs[0],
    price: algoOutput.timestamps[algoOutput.timestamps.length - 1].price,
    // type: algo.actionType(),
    intervalNumber: algoOutput.timestamps.length,
    timestamp:
      algoOutput.timestamps[algoOutput.timestamps.length - 1].timestamp,
  };
  return currentOpportunity;
};

/**
 * Sliding window opportunities are the ones where Algo is the interval of the algo slides as we move.
 * For example given 10 days data and window size 2, there will be multiple algo runs:
 * day: 1,2|2,3|3,4|..
 *
 * @param ticker
 * @param horizon
 * @param endDate
 * @param algo
 */
export const getSlidingWindowOpportunities = async (
  ticker: string,
  horizon: number,
  endDate: Moment,
  algo: Algo,
  windowSize: number
): Promise<Opportunity[]> => {
  const algoIndex = 0; // because there is only one algo we are running
  const stockData = await timeseriesManager.getStockTimeseries(
    ticker,
    horizon,
    endDate
  );
  // No data found for the stock ticker
  if (stockData.prices === undefined || stockData.prices.length === 0) {
    return [
      <Opportunity>{
        symbol: ticker,
        indicatorValues: [],
        // type: algo.actionType(),
        intervalNumber: -1,
        timestamp: -1,
      },
    ];
  }

  console.log(`STOCK DATA LENGTH: ${stockData.prices.length}`);

  let finalAlgoResponse: AlgosResponse = {
    algoNames: [algo.name()],
    timestamps: [],
    types: [algo.actionType()],
  };

  // when window is partial we first fill the first window
  // [x, x], x
  const firstWindowAlgoResponse = await algoExecutor.execute(
    stockData,
    [algo],
    0, // start index
    windowSize // end index + 1
  );
  finalAlgoResponse.timestamps.push(...firstWindowAlgoResponse.timestamps);

  // now for each full windows
  for (var i = windowSize + 1; i < stockData.prices.length + 1; i++) {
    const windowAlgoResponse = await algoExecutor.execute(
      stockData,
      [algo],
      i - windowSize, // start index
      i // end index + 1
    );

    // add the last value only, as we will now incrementally get values per window
    finalAlgoResponse.timestamps.push(
      windowAlgoResponse.timestamps[windowAlgoResponse.timestamps.length - 1]
    );
  }

  console.log(
    `Final ALGO RESPONSE SIZE: ${finalAlgoResponse.timestamps.length}`
  );
  // finally transform to the Opportunity object
  return finalAlgoResponse.timestamps.map((timestamp, intervalNumber) => {
    return <Opportunity>{
      symbol: ticker,
      indicatorValues: timestamp.algoOutputs[algoIndex],
      price: timestamp.price,
      // type: algo.actionType(),
      intervalNumber: intervalNumber,
      timestamp: timestamp.timestamp,
    };
  });
};
