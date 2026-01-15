import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Check if it's our custom AppError
  if (err instanceof AppError || ('statusCode' in err && 'status' in err)) {
    const appError = err as AppError;
    const statusCode = appError.statusCode || 500;
    const status = appError.status || 'error';
    const message = appError.message || 'Internal Server Error';

    res.status(statusCode).json({
      status,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  } else {
    // Handle unexpected errors
    res.status(500).json({
      status: 'error',
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }
};
