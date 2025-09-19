import { AuthGuard } from '@/auth/auth.guard';
import { ApiAuth } from '@/decorators/http.decorators';
import { Public } from '@/decorators/public.decorator';
import { Body, Controller, Logger, Post, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { ChatService } from './chat.service';
import { StreamChatRequestDto } from './dto/chat.dto';

@ApiTags('Chat')
@Controller({
  path: 'chat',
  version: '1',
})
@UseGuards(AuthGuard)
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post('stream')
  @Public()
  @ApiAuth({
    summary: 'Generate a streaming chat response',
  })
  @ApiOperation({
    summary: 'Generate a streaming chat response using AI',
    description:
      'Generates a streaming chat response from the AI model with real-time updates.',
  })
  @ApiResponse({
    status: 200,
    description: 'Streaming chat response started successfully',
    headers: {
      'Content-Type': {
        description: 'text/plain; charset=utf-8',
        schema: { type: 'string' },
      },
      'Cache-Control': {
        description: 'no-cache',
        schema: { type: 'string' },
      },
      Connection: {
        description: 'keep-alive',
        schema: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async streamChat(
    @Body() dto: StreamChatRequestDto,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    try {
      this.logger.debug(
        `Starting streaming chat for ${dto.messages.length} messages`,
      );

      const streamResult = await this.chatService.streamChatResponse(dto);

      // Use AI SDK's recommended approach for Fastify
      streamResult.pipeTextStreamToResponse(reply.raw);

      this.logger.debug('Streaming chat completed successfully');
    } catch (error) {
      this.logger.error('Error in streamChat:', error);

      // Send error response
      reply.status(500).send({
        error: 'Failed to generate streaming response',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
