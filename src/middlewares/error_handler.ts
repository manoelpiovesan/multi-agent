import {Request, Response, NextFunction} from 'express';

/**
 * Error handler middleware for Express applications.
 * This middleware catches errors thrown in the application,
 * logs them to the console, and sends a standardized error response.
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err) {
    console.error(err)
    res.status(err.status_code ?? err.status ?? 500).send({
      success: false,
      error: err.message ?? 'Internal server error',
      fields: err.fields ?? undefined,
    });
  } else {
    res.status(500).send({
      success: false
    })
  }
}
