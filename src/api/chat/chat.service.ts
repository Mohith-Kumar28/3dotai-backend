import { openai } from '@ai-sdk/openai';
import { Injectable, Logger } from '@nestjs/common';
import {
  Experimental_Agent as Agent,
  convertToModelMessages,
  streamText,
  ToolSet,
} from 'ai';

import { ChatMessageDto, StreamChatRequestDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly defaultModel = 'gpt-4o';
  private readonly defaultTemperature = 0.7;
  private readonly defaultMaxTokens = 1000;
  private readonly agent: Agent<ToolSet, never, never>;

  constructor() {
    this.logger.log('ChatService initialized with OpenAI integration');

    // Initialize the AI agent with TikTok assistant configuration
    this.agent = new Agent({
      model: openai(this.defaultModel),
      system: `You are a helpful TikTok assistant that can help users with TikTok-related tasks. 
        You can provide information about TikTok users, videos, trends, and analytics. 
        Always be friendly, informative, and focused on TikTok-related queries. 
        When using tools, explain what you're doing and provide clear, actionable insights.`,
      tools: this.getTikTokTools(),
    });
  }

  /**
   * Generate a streaming chat response with tool calling support using AI Agent
   */
  async streamChatResponse(dto: StreamChatRequestDto) {
    try {
      const {
        messages,
        model = this.defaultModel,
        temperature = this.defaultTemperature,
        maxTokens = this.defaultMaxTokens,
      } = dto;

      this.logger.debug(
        `Starting streaming chat with agent, messages: ${messages.length}`,
      );

      // Use streamText with model configuration and tools

      const streamConfig: any = {
        model: openai(model),
        //@ts-expect-error convertToModelMessages expects a UIMessage[] from ai import
        messages: convertToModelMessages(messages),
        system: `You are a helpful TikTok assistant that can help users with TikTok-related tasks. 
          You can provide information about TikTok users, videos, trends, and analytics. 
          Always be friendly, informative, and focused on TikTok-related queries. 
          When using tools, explain what you're doing and provide clear, actionable insights.`,
        temperature,
        maxTokens,
        onFinish: ({ text, toolCalls, toolResults, usage }) => {
          this.logger.debug(
            `Stream finished - Text length: ${text?.length || 0}, Tool calls: ${toolCalls?.length || 0}, Usage: ${JSON.stringify(usage)}`,
          );
        },
      };

      // Add tools if available
      const tools = this.getTikTokTools();
      if (tools && Object.keys(tools).length > 0) {
        streamConfig.tools = tools;
      }

      const result = streamText(streamConfig);

      return result;
    } catch (error) {
      this.logger.error('Error starting streaming chat with agent:', error);
      throw new Error(
        `Failed to start streaming chat: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Extract content from message, handling both parts array and direct content
   */
  private extractMessageContent(message: ChatMessageDto): string {
    if (message.parts && message.parts.length > 0) {
      return message.parts.map((part) => part.text).join(' ');
    }
    return message.content || '';
  }

  /**
   * Get available TikTok service tools (extensible structure)
   * This will be expanded to include actual TikTok API tools
   */
  private getTikTokTools() {
    // TODO: Implement actual TikTok service tools
    // Example structure for future tools using AI SDK tool helper:
    // return {
    //   get_tiktok_user_info: tool({
    //     description: 'Get TikTok user information',
    //     inputSchema: z.object({
    //       username: z.string().describe('TikTok username')
    //     }),
    //     execute: async ({ username }) => {
    //       // Implementation for getting TikTok user info
    //       return { username, followers: 0, following: 0 };
    //     }
    //   }),
    //   get_tiktok_videos: tool({
    //     description: 'Get TikTok videos for a user',
    //     inputSchema: z.object({
    //       username: z.string().describe('TikTok username'),
    //       limit: z.number().describe('Number of videos to fetch').optional().default(10)
    //     }),
    //     execute: async ({ username, limit }) => {
    //       // Implementation for getting TikTok videos
    //       return { username, videos: [], count: 0 };
    //     }
    //   })
    // };

    return {}; // Return empty object for now, will be populated with actual tools
  }

  /**
   * Get available models
   */
  getAvailableModels(): string[] {
    return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      model: this.defaultModel,
      temperature: this.defaultTemperature,
      maxTokens: this.defaultMaxTokens,
    };
  }
}
