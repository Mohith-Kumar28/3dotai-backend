export interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolResult {
  toolCallId: string;
  result: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  timestamp?: Date;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: Tool[];
}

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ChatResponse {
  id: string;
  message: ChatMessage;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

export interface StreamChatResponse {
  id: string;
  delta: {
    role?: 'assistant';
    content?: string;
    toolCalls?: ToolCall[];
  };
  finishReason?: string;
}

export interface TikTokServiceContext {
  userId?: string;
  accessToken?: string;
  apiVersion?: string;
}

export interface ChatSession {
  id: string;
  userId?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChatSessionInput {
  userId?: string;
  initialMessage?: ChatMessage;
}

export interface UpdateChatSessionInput {
  messages?: ChatMessage[];
}
