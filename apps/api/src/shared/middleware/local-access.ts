import { RequestHandler } from 'express';

export const localOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'];
// Это защита локального приложения, НЕ замена аутентификации для публичного деплоя.
export const localAccess: RequestHandler = (req, res, next) => {
  const host = req.headers.host?.split(':')[0];
  const origin = req.get('origin');
  if (!['localhost', '127.0.0.1'].includes(host || '') || (origin && !localOrigins.includes(origin))) {
    res.status(403).json({ data: null, error: 'Разрешён только локальный доступ', meta: null });
    return;
  }
  next();
};
