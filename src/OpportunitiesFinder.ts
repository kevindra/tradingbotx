import Bottleneck from 'bottleneck';
import {Algo} from './algo/algo';
import {AlgoExecutor} from './AlgoExecutor';

export interface Opportunity {
  symbol: string;
  indicatorValues: number[];
  // sellConfidence: number;
  price: number;
  type: OpportunityType;
}

export type OpportunityType = 'buy' | 'sell';

export interface Opportunities {
  opportunities: Opportunity[];
  // sellOpportunities: Opportunity[];
}

const algoExecutor = new AlgoExecutor();

export class OpportunitiesFinder {
  constructor() {}

  async findOpportunities(
    symbols: string[],
    horizon: number,
    algo: Algo,
    indicatorIndex: number,
    minIndicatorValue: number,
    maxIndicatorValue: number
  ) {
    // 75 requests per 1 minute
    // api allows 5 requests per minute, 500 per day
    const limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 1000,
    });

    const allOpportunities = await Promise.all(
      symbols.map(async symbol => {
        const conf = await limiter.schedule(
          async () =>
            await algoExecutor.executeAlgoOnStock(symbol, horizon, [algo])
        );
        return <Opportunity>{
          symbol: symbol,
          indicatorValues: [
            conf.timestamps[conf.timestamps.length - 1].algoOutputs[0][
              indicatorIndex
            ],
          ],
          price: conf.timestamps[conf.timestamps.length - 1].price,
          type: algo.actionType(),
        };
      })
    );

    const filteredOpportunities: Opportunity[] = allOpportunities
      .filter(o => o.indicatorValues[0] >= minIndicatorValue)
      .filter(o => o.indicatorValues[0] <= maxIndicatorValue)
      .sort((a, b) =>
        a.indicatorValues[0] < b.indicatorValues[0]
          ? 1
          : a.indicatorValues[0] > b.indicatorValues[0]
          ? -1
          : 0
      );

    return <Opportunities>{
      opportunities: filteredOpportunities,
    };
  }
}
