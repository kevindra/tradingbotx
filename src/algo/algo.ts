/**
 * A generic Algo interface
 */
export interface Algo {
  /**
   * This method runs the algorithm and returns the indicator values calculated by the algo.
   * @param algoInput Input to the algorithm
   */
  run(algoInput: AlgoInput): Promise<AlgoOutput>;
  /**
   * Action algorithm recommends users to take i.e. buy or sell.
   */
  actionType(): AlgoActionType;
  /**
   * Name of the algorithm.
   */
  name(): string;
  /**
   * A unique Id of the algorithm
   */
  id(): string;
}

/**
 * Inputs and outputs of the algo
 */
export interface AlgoInput {
  open: number[],
  close: number[],
  adjustedClose: number[];
  high: number[],
  low: number[],
  volume: number[],
  splitCoefficient: number[]
}

export interface AlgoOutput {
  indicators: number[][];
}

export type AlgoActionType = 'buy' | 'sell';
