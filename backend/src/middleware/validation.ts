import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

/**
 * Validate request body has required fields
 */
export const validateRequired = (fields: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const missing: string[] = [];

    fields.forEach((field) => {
      if (!req.body[field] && req.body[field] !== 0) {
        missing.push(field);
      }
    });

    if (missing.length > 0) {
      throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
    }

    next();
  };
};

/**
 * Validate poll creation request
 */
export const validatePollCreation = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const { question, options, duration } = req.body;

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    throw new ValidationError('Question must be a non-empty string');
  }

  if (!Array.isArray(options) || options.length < 2) {
    throw new ValidationError('Options must be an array with at least 2 items');
  }

  if (typeof duration !== 'number' || duration < 1 || duration > 60) {
    throw new ValidationError('Duration must be a number between 1 and 60');
  }

  next();
};

/**
 * Validate vote submission request
 */
export const validateVoteSubmission = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const { pollId, studentId, optionIndex } = req.body;

  if (!pollId || typeof pollId !== 'string') {
    throw new ValidationError('Poll ID is required and must be a string');
  }

  if (!studentId || typeof studentId !== 'string') {
    throw new ValidationError('Student ID is required and must be a string');
  }

  if (typeof optionIndex !== 'number' || optionIndex < 0) {
    throw new ValidationError('Option index must be a non-negative number');
  }

  next();
};
