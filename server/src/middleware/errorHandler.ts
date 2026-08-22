import type { NextFunction, Request, Response } from 'express';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error(err);

  if (err.name === 'ValidationError') {
    res.status(400).json({ message: 'Validation error', details: err.message });
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json({ message: 'Invalid identifier' });
    return;
  }

  res.status(500).json({ message: 'Internal server error' });
}
