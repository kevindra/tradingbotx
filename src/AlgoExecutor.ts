import _ from 'lodash';
import {SecurityTimeseriesManager} from './SecurityTimeseriesManager';
import {Price, PriceTimeSeriesData} from './SecurityTimeseriesAdapter';
import {Algo, AlgoActionType, AlgoOutput} from './algo/algo';
import {Moment} from 'moment';
import {BuyLowAlgo} from './algo/buylowalgo';

const timeseriesManager = new SecurityTimeseriesManager();

export interface AlgosResponse {
  timestamps: AlgoTimestamps[];
  types: AlgoActionType[];
  algoNames: string[];
}

export interface AlgoTimestamps {
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
    return await this._executeOnPrices(prices, algos);
  }

  // TODO clean up and reuse. DRY
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

      let perTimestampResponse: AlgoTimestamps = {
        timestamp: row.timestamp,
        price: row.close,
        algoOutputs: algoOutputs,
      };
      return perTimestampResponse;
    });

    let algoExecutorResponse: AlgosResponse = {
      timestamps: timestamps,
      types: algos.map(a => a.actionType()),
      algoNames: algos.map(a => a.name()),
    };
    return algoExecutorResponse;
  }

  /**
   * Runs algorithms on a {PriceTimeSeriesData}
   * @param priceData {PriceTimeSeriesData}
   * @param algos {Algo[]}
   * @returns {AlgosResponse}
   */
  async execute(
    priceData: PriceTimeSeriesData,
    algos: Algo[],
    startIndex: number,
    exclusiveEndIndex: number
  ) {
    const prices = priceData.prices.slice(startIndex, exclusiveEndIndex);
    return await this._executeOnPrices(prices, algos);
  }

  private async _executeOnPrices(prices: Price[], algos: Algo[]) {
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

      let perTimestampResponse: AlgoTimestamps = {
        timestamp: row.timestamp,
        price: row.adjustedClosePrice,
        algoOutputs: algoOutputs,
      };
      return perTimestampResponse;
    });

    let algoExecutorResponse: AlgosResponse = {
      timestamps: timestamps,
      types: algos.map(a => a.actionType()),
      algoNames: algos.map(a => a.name()),
    };
    return algoExecutorResponse;
  }
}
