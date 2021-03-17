import Bottleneck from 'bottleneck';
import moment, {Moment} from 'moment-timezone';
import {Algo} from './algo/algo';
import {AlgoExecutor} from './AlgoExecutor';

export interface Opportunity {
  symbol: string;
  indicatorValues: number[];
  price?: number;
  type: OpportunityType;
  intervalNumber: number;
  timestamp: number;
}

export type OpportunityType = 'buy' | 'sell';

export interface Opportunities {
  opportunities: Opportunity[];
}

const algoExecutor = new AlgoExecutor();

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
              type: algo.actionType(),
              intervalNumber: i + 1,
              timestamp: conf.timestamps[i].timestamp,
            };
          });
        } else {
          opps = [
            <Opportunity>{
              symbol: symbol,
              indicatorValues: [],
              type: algo.actionType(),
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
            type: algo.actionType(),
            intervalNumber: conf.timestamps.length,
            timestamp: conf.timestamps[conf.timestamps.length - 1].timestamp,
          };
        } else {
          return <Opportunity>{
            symbol: symbol,
            indicatorValues: [],
            type: algo.actionType(),
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
