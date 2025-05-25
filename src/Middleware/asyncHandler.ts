import { Request, RequestHandler, Response, NextFunction } from 'express';

type AsyncRequestHandler<T = Request> = (
  req: T,
  res: Response,
  next: NextFunction
) => Promise<any>;

const asyncHandler = <T extends Request = Request>(
  fn: AsyncRequestHandler<T>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return Promise.resolve(fn(req as T, res, next)).catch(next);
  };
};

export default asyncHandler;