import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env'), quiet: true });

const port = Number(process.env.PORT ?? 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT должен быть целым числом 1–65535');
const provider = process.env.AI_PROVIDER || 'openrouter';
if (provider !== 'openrouter' && provider !== 'openai') throw new Error('Неверный AI_PROVIDER');

export const config = {
  port,
  host: '127.0.0.1', // single-user API: не открывать в Интернет без auth reverse proxy
  postbackToken: process.env.POSTBACK_TOKEN,
  db: { url: process.env.DATABASE_URL! },
  openai: { apiKey: process.env.OPENAI_API_KEY },
  telegram: { token: process.env.TELEGRAM_BOT_TOKEN! }, // If needed elsewhere
  ai: {
    // Which AIProvider implementation to use: 'openrouter' (default) or 'openai'
    provider: provider,
    openrouter: {
      // Может отсутствовать — провайдер проверяет при первом AI-вызове
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL ?? 'deepseek/deepseek-chat',
    },
  },
} as const;
