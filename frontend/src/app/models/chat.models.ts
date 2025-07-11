export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  rating: RatingEnum;
  conversationId?: string;
  isStreaming?: boolean;
}

export enum RatingEnum {
  None = 0,
  Like = 1,
  Dislike = 2
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  lastMessage?: string;
}

export interface SendMessageRequest {
  message: string;
  conversationId?: string;
}

export interface RateMessageRequest {
  messageId: string;
  rating: RatingEnum;
}

export interface RateMessageResponse {
  success: boolean;
  messageId: string;
  rating: RatingEnum;
}

export interface ConversationHistory {
  conversations: Conversation[];
  total: number;
}

export interface MessageHistory {
  messages: ChatMessage[];
  conversationId: string;
  conversationTitle: string;
}

export interface StreamMessageChunk {
  type: 'start' | 'chunk' | 'complete' | 'error';
  content: string;
  messageId?: string;
  conversationId?: string;
  timestamp?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}
