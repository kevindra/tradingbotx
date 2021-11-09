import { BuyLowAlgo } from './buylowalgo';
import { PercentDown } from './PercentDown';
import { PercentUp } from './PercentUp';
import { SellHighAlgo } from './sellhighalgo';

export const ALGO_REGISTRY = [
  new BuyLowAlgo(),
  new SellHighAlgo(),
  new PercentDown(),
  new PercentUp(),
  /**
   * Add your new Algo here
   */
];

export function getAllAlgoIds() {
  return ALGO_REGISTRY.map(a => a.id());
}

export function getAllAlgoNames() {
  return ALGO_REGISTRY.map(a => a.name());
}

export function getAlgoById(id: string) {
  const matchingAlgos = ALGO_REGISTRY.filter(a => a.id() === id);
  if (matchingAlgos.length > 0) return matchingAlgos[0];
  throw new Error(`No matching algo found by id: ${id}`);
}
