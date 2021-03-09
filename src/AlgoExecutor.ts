import _ from 'lodash';
import {SecurityTimeseriesManager} from './SecurityTimeseriesManager';
import {PriceTimeSeriesData} from './SecurityTimeseriesAdapter';
import {Algo, AlgoActionType, AlgoOutput} from './algo/algo';

const timeseriesManager = new SecurityTimeseriesManager();

interface AlgoExecutorResponse {
  timestamps: AlgoExecutorTimestampResponse[];
  types: AlgoActionType[];
}

interface AlgoExecutorTimestampResponse {
  timestamp: number;
  price: number;
  algoOutputs: number[][]; // per algo per indicator value [algoIndex][indicatorIndex] => value
}

export class AlgoExecutor {
  constructor() {}

  async executeAlgoOnStock(ticker: string, horizon: number, algos: Algo[]) {
    const stockData = await timeseriesManager.getStockTimeseries(
      ticker,
      horizon
    );
    const prices = stockData.prices;

    const rawAlgoOutputs: AlgoOutput[] = [];
    for (let a in algos) {
      rawAlgoOutputs.push(
        await algos[a].run({
          prices: prices.map(price => price.price),
        })
      );
    }

    const timestamps = prices.map((row, timeIndex) => {
      let algoOutputs: number[][] = [];
      rawAlgoOutputs.forEach((algo, alg) => {
        let indicatorValues: number[] = [];
        rawAlgoOutputs[alg].indicators.forEach((indicator, ind) => {
          indicatorValues.push(indicator[timeIndex]);
        });
        algoOutputs.push(indicatorValues);
      });

      let perTimestampResponse: AlgoExecutorTimestampResponse = {
        timestamp: row.timestamp,
        price: row.price,
        algoOutputs: algoOutputs,
      };
      return perTimestampResponse;
    });

    let algoExecutorResponse: AlgoExecutorResponse = {
      timestamps: timestamps,
      types: algos.map(a => {
        return a.actionType();
      }),
    };
    return algoExecutorResponse;
  }

  async executeAlgoOnCrypto(
    ticker = 'BTC',
    currency = 'USD',
    horizon = 365,
    algos: Algo[]
  ) {
    const cryptoData: PriceTimeSeriesData = await timeseriesManager.getCryptoTimeseries(
      ticker,
      currency,
      horizon
    );

    const prices = cryptoData.prices;
    const rawAlgoOutputs: AlgoOutput[] = [];
    for (let a in algos) {
      rawAlgoOutputs.push(
        await algos[a].run({
          prices: prices.map(price => price.price),
        })
      );
    }

    const timestamps = prices.map((row, timeIndex) => {
      let algoOutputs: number[][] = [];
      rawAlgoOutputs.forEach((algo, alg) => {
        let indicatorValues: number[] = [];
        rawAlgoOutputs[alg].indicators.forEach((indicator, ind) => {
          indicatorValues.push(indicator[timeIndex]);
        });
        algoOutputs.push(indicatorValues);
      });

      let perTimestampResponse: AlgoExecutorTimestampResponse = {
        timestamp: row.timestamp,
        price: row.price,
        algoOutputs: algoOutputs,
      };
      return perTimestampResponse;
    });

    let algoExecutorResponse: AlgoExecutorResponse = {
      timestamps: timestamps,
      types: algos.map(a => a.actionType()),
    };
    return algoExecutorResponse;
  }
}
