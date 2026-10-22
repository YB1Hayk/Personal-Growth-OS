export interface OutreachTemplate {
  id: string
  name: string
  content: string
  projectId: string
  createdAt: Date
  updatedAt: Date
}

export interface OutreachLog {
  id: string
  leadId: string
  templateId: string
  message: string
  status: 'SENT' | 'FAILED'
  createdAt: Date
}

export interface CreateTemplateDto {
  name: string
  content: string
  projectId: string
}

export interface SendTemplateDto {
  leadId: string
  templateId: string
}

export interface GenerateMessageDto {
  leadId: string
  projectId: string
  insightId?: string
}
