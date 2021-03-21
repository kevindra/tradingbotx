import _ from 'lodash';
import {SecurityTimeseriesManager} from './SecurityTimeseriesManager';
import {PriceTimeSeriesData} from './SecurityTimeseriesAdapter';
import {Algo, AlgoActionType, AlgoOutput} from './algo/algo';
import {Moment} from 'moment';

const timeseriesManager = new SecurityTimeseriesManager();

interface AlgoExecutorResponse {
  timestamps: AlgoExecutorTimestampResponse[];
  types: AlgoActionType[];
  algoNames: string[];
}

interface AlgoExecutorTimestampResponse {
  timestamp: number;
  price: number;
  algoOutputs: number[][]; // per algo per indicator value [algoIndex][indicatorIndex] => value
}

export class AlgoExecutor {
  constructor() {}

  async executeAlgoOnStock(
    ticker: string,
    horizon: number,
    endDate: Moment,
    algos: Algo[]
  ) {
    const stockData = await timeseriesManager.getStockTimeseries(
      ticker,
      horizon,
      endDate
    );
    const prices = stockData.prices;

    const rawAlgoOutputs: AlgoOutput[] = [];
    for (let a in algos) {
      rawAlgoOutputs.push(
        await algos[a].run({
          open: prices.map(p => p.open),
          close: prices.map(p => p.close),
          adjustedClose: prices.map(price => price.adjustedClosePrice),
          low: prices.map(p => p.low),
          high: prices.map(p => p.high),
          volume: prices.map(p => p.volume),
          splitCoefficient: prices.map(p => p.splitCoefficient),
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
        price: row.adjustedClosePrice,
        algoOutputs: algoOutputs,
      };
      return perTimestampResponse;
    });

    let algoExecutorResponse: AlgoExecutorResponse = {
      timestamps: timestamps,
      types: algos.map(a => a.actionType()),
      algoNames: algos.map(a => a.name()),
    };
    return algoExecutorResponse;
  }

  async executeAlgoOnCrypto(
    ticker: string,
    currency: string,
    horizon: number,
    endDate: Moment,
    algos: Algo[]
  ) {
    const cryptoData: PriceTimeSeriesData = await timeseriesManager.getCryptoTimeseries(
      ticker,
      currency,
      horizon,
      endDate
    );

    const prices = cryptoData.prices;
    const rawAlgoOutputs: AlgoOutput[] = [];
    for (let a in algos) {
      rawAlgoOutputs.push(
        await algos[a].run({
          open: prices.map(p => p.open),
          close: prices.map(p => p.close),
          adjustedClose: prices.map(price => price.adjustedClosePrice),
          low: prices.map(p => p.low),
          high: prices.map(p => p.high),
          volume: prices.map(p => p.volume),
          splitCoefficient: prices.map(p => p.splitCoefficient),
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
        price: row.close,
        algoOutputs: algoOutputs,
      };
      return perTimestampResponse;
    });

    let algoExecutorResponse: AlgoExecutorResponse = {
      timestamps: timestamps,
      types: algos.map(a => a.actionType()),
      algoNames: algos.map(a => a.name()),
    };
    return algoExecutorResponse;
  }
}
