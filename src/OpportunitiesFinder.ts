import Bottleneck from 'bottleneck';
import {ConfidenceCalculator} from './ConfidenceCalculator';
const confidenceCalculator = new ConfidenceCalculator();

export interface Opportunity {
  symbol: string;
  buyConfidence: number;
  sellConfidence: number;
  price: number;
}

export interface Opportunities {
  buyOpportunities: Opportunity[];
  sellOpportunities: Opportunity[];
}

export class OpportunitiesFinder {
  constructor() {}

  async findOpportunities(
    symbols: string[],
    horizon: number,
    buyConfidenceThreshold = 40,
    sellConfidenceThreshold = 40
  ) {
    // 1 request per 15 seconds
    // api allows 5 requests per minute, 500 per day
    const limiter = new Bottleneck({
      maxConcurrent: 1,
      minTime: 15000,
    });

    const allOpportunities = await Promise.all(
      symbols.map(async symbol => {
        const conf = await limiter.schedule(
          async () => await confidenceCalculator.stockBuyerConf(symbol, horizon)
        );
        return <Opportunity>{
          symbol: symbol,
          buyConfidence: conf[conf.length - 2][2],
          sellConfidence: 100 - conf[conf.length - 2][2]!,
          price: conf[conf.length - 2][1],
        };
      })
    );

    const buyOpportunities: Opportunity[] = allOpportunities
      .filter(o => o.buyConfidence > buyConfidenceThreshold)
      .sort((a, b) =>
        a.buyConfidence < b.buyConfidence
          ? 1
          : a.buyConfidence > b.buyConfidence
          ? -1
          : 0
      );

    const sellOpportunities: Opportunity[] = allOpportunities
      .filter(o => o.sellConfidence > sellConfidenceThreshold)
      .sort((a, b) =>
        a.sellConfidence < b.sellConfidence
          ? 1
          : a.sellConfidence > b.sellConfidence
          ? -1
          : 0
      );

    return <Opportunities>{
      buyOpportunities,
      sellOpportunities,
    };
  }
}