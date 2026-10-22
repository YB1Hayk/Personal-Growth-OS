import { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/AppError';

export const asyncHandler = (fn: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve().then(() => fn(req, res, next)).catch(next);

export const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
  if (res.headersSent) return _next(err);
  const bodyError = err as { type?: string };
  const status = err instanceof AppError ? err.statusCode
    : err instanceof ZodError || bodyError?.type === 'entity.parse.failed' ? 400
    : bodyError?.type === 'entity.too.large' ? 413 : 500;
  const message = err instanceof AppError ? err.message
    : status === 400 ? 'Некорректные входные данные'
    : status === 413 ? 'Слишком большой запрос' : 'Внутренняя ошибка сервера';
  // Не логируем тело запроса, Axios-конфиг или секреты.
  if (status === 500) console.error('[API] Unhandled error');
  res.status(status).json({ data: null, error: { message, code: err instanceof AppError ? err.code : 'REQUEST_ERROR' }, meta: null });
};
