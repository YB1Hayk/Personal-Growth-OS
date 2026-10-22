import axios from 'axios';

export const PublishService = {
  async sendToTelegram(token: string, chatId: string, text: string): Promise<void> {
    if (!token || !chatId) throw new Error('Telegram не настроен');
    if (Array.from(text).length > 4096) throw new Error('Текст превышает лимит Telegram 4096 символов');
    try {
      const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId, text, // AI генерирует plain text, а не безопасный Telegram HTML
      }, { timeout: 10000 });
      if (response.data?.ok !== true) throw new Error('Telegram не подтвердил отправку');
    } catch {
      // Axios error содержит URL с токеном: не логируем и не пробрасываем его.
      throw new Error('Ошибка отправки в Telegram');
    }
  },
};
