import {Request, Response, NextFunction} from 'express';
import {AlgoId, getAlgoById} from './algo/algolookup';

/**
 * A generic function to catch all exceptions for the input function and route them to express's next function
 */
export const withTryCatchNext = async (
  req: Request,
  res: Response,
  next: NextFunction,
  func: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  try {
    await func(req, res, next);
  } catch (err) {
    next(err);
  }
};

export const getAlgosFromRequest = (req: Request) => {
  const algoIds: AlgoId[] = ((req.query.algoIds as string) || 'buy-low').split(
    ','
  ) as AlgoId[];

  const algosToRun = algoIds.map(a => {
    const algo = getAlgoById(a);
    if (!algo) throw new Error(`Invalid algo name ${a}`);
    return algo;
  });

  return algosToRun;
};

export const getAlgoFromRequest = (req: Request) => {
  const algoId: AlgoId = ((req.query.algoId as string) || 'buy-low') as AlgoId;

  const algo = getAlgoById(algoId);
  if (!algo) throw new Error(`Invalid algo name ${algoId}`);
  return algo;
};

export const getIndicatorFromRequest = (req: Request) => {
  return parseInt((req.query.indicator as string) || '0');
};
