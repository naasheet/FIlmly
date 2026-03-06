import type { NextFunction, Request, Response } from "express"

export class AppError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: any,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message })
  }

  const message = err instanceof Error ? err.message : "Internal server error"
  return res.status(500).json({ message })
}
