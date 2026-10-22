export type AIChatRole = 'system' | 'user' | 'assistant';

export interface AIChatMessage {
  role: AIChatRole;
  content: string;
}

export interface AIRequestOptions {
  /** 0.3 — продажи/outreach (точность), 0.8 — контент (креатив). См. CLAUDE_1.md */
  temperature?: number;
}

export interface AIProvider {
  /** Single-prompt completion, no system message. Returns the raw text. */
  generateText(prompt: string, options?: AIRequestOptions): Promise<string>;
  /** Multi-turn chat. Returns the assistant's text content. */
  chat(messages: AIChatMessage[], options?: AIRequestOptions): Promise<string>;
  /** Chat call that asks the model to reply with JSON. Returns the raw JSON string. */
  chatJSON(messages: AIChatMessage[], options?: AIRequestOptions): Promise<string>;
}
