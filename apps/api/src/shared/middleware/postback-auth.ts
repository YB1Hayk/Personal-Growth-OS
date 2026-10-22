import { timingSafeEqual } from 'node:crypto';
import { RequestHandler } from 'express';
import { config } from '../lib/config';

export function tokensMatch(actual: string, expected: string): boolean {
  const a = Buffer.from(actual); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export const postbackAuth: RequestHandler = (req, res, next) => {
  if (!config.postbackToken || config.postbackToken.length < 32) {
    res.status(503).json({ data: null, error: 'Настройте POSTBACK_TOKEN (минимум 32 символа)', meta: null });
    return;
  }
  const token = req.get('x-postback-token') || '';
  if (!tokensMatch(token, config.postbackToken)) {
    res.status(401).json({ data: null, error: 'Неверная авторизация постбека', meta: null });
    return;
  }
  next();
};
