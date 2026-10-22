import { PublishService } from '../../publish.service';
// Одна реализация Telegram transport: plain text, timeout и безопасные ошибки.
export class TelegramService {
  sendMessage(token: string, chatId: string, text: string): Promise<void> {
    return PublishService.sendToTelegram(token, chatId, text);
  }
}
export const telegramService = new TelegramService();
