export interface CoachTip {
  priority: 'high' | 'medium' | 'low'
  category: string
  message: string
  action: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}