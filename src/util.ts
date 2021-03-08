import {Request, Response, NextFunction} from 'express';

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
