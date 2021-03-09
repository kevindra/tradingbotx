/**
 * A generic Algo interface
 */
export interface Algo {
  run(algoInput: AlgoInput): Promise<AlgoOutput>;
}

/**
 * Inputs and outputs of the algo
 */
export interface AlgoInput {
  prices: number[];
}

export interface AlgoOutput {
  indicators: number[][];
}
