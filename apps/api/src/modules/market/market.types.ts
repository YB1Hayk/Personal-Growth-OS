export interface MarketInsight {
  id: string;
  projectId: string;
  content: string;
  category: string;
  source: string | null;
  createdAt: Date;
}

export interface CreateInsightDto {
  projectId: string;
  content: string;
  category: string;
  source?: string | null;
}

export interface MarketIntelligence {
  dna: string;
  brandVoice: string;
}
