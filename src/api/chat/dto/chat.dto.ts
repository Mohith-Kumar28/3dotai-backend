import {
  BooleanFieldOptional,
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
} from '@/decorators/field.decorators';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class ToolCallDto {
  @ApiProperty({
    description: 'Unique identifier for the tool call',
    example: 'call_123',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Type of the tool call',
    example: 'function',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Function details for the tool call',
    example: {
      name: 'get_tiktok_user_info',
      arguments: '{"username":"example"}',
    },
  })
  @IsObject()
  function: {
    name: string;
    arguments: string;
  };
}

export class ToolResultDto {
  @ApiProperty({
    description: 'Unique identifier for the tool call this result belongs to',
    example: 'call_123',
  })
  @IsString()
  toolCallId: string;

  @ApiProperty({
    description: 'Result of the tool call',
    example: { user_id: '123', username: 'example', followers: 1000 },
  })
  @IsObject()
  result: any;
}

export class MessagePartDto {
  @ApiProperty({
    description: 'Type of the message part',
    example: 'text',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Text content of the message part',
    example: 'Hello, how can I help you?',
  })
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: 'State of the message part (for assistant messages)',
    example: 'done',
  })
  @IsOptional()
  @IsString()
  state?: string;
}

@Exclude()
export class ChatMessageDto {
  @ApiProperty({
    description: 'Unique identifier for the message',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  @Expose()
  id?: string;

  @ApiProperty({
    description: 'Role of the message sender',
    enum: ['user', 'assistant', 'system', 'tool'],
    example: 'user',
  })
  @IsEnum(['user', 'assistant', 'system', 'tool'])
  @Expose()
  role: 'user' | 'assistant' | 'system' | 'tool';

  @ApiPropertyOptional({
    description: 'Content of the message (for backward compatibility)',
    example: 'Hello, how can I help you today?',
  })
  @IsOptional()
  @IsString()
  @Expose()
  content?: string;

  @ApiPropertyOptional({
    description: 'Parts array containing message content',
    type: [MessagePartDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessagePartDto)
  @Expose()
  parts?: MessagePartDto[];

  @ApiPropertyOptional({
    description: 'Tool calls made by the assistant',
    type: [ToolCallDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ToolCallDto)
  @Expose()
  toolCalls?: ToolCallDto[];

  @ApiPropertyOptional({
    description:
      'Tool call ID this message is responding to (for tool role messages)',
    example: 'call_123',
  })
  @IsOptional()
  @IsString()
  @Expose()
  toolCallId?: string;

  @ApiPropertyOptional({
    description: 'Timestamp when the message was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @Expose()
  timestamp?: Date;

  // Transform parts to content for processing
  @Transform(({ obj }) => {
    if (obj.parts && obj.parts.length > 0) {
      return obj.parts.map((part: MessagePartDto) => part.text).join(' ');
    }
    return obj.content;
  })
  get processedContent(): string {
    if (this.parts && this.parts.length > 0) {
      return this.parts.map((part) => part.text).join(' ');
    }
    return this.content || '';
  }
}

export class ChatRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  @ApiProperty({
    type: [ChatMessageDto],
    description: 'Array of chat messages',
  })
  messages: ChatMessageDto[];

  @StringFieldOptional()
  model?: string;

  @NumberFieldOptional({
    minimum: 0,
    maximum: 2,
    description: 'Controls randomness in the response (0-2)',
  })
  temperature?: number;

  @NumberFieldOptional({
    minimum: 1,
    maximum: 4096,
    description: 'Maximum number of tokens to generate',
  })
  maxTokens?: number;

  @BooleanFieldOptional()
  stream?: boolean;

  // Optional frontend-specific properties that should be ignored
  @ApiPropertyOptional({
    description: 'Web search flag (ignored by backend)',
  })
  @IsOptional()
  webSearch?: boolean;

  @ApiPropertyOptional({
    description: 'Frontend conversation ID (ignored by backend)',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description: 'Frontend trigger type (ignored by backend)',
  })
  @IsOptional()
  @IsString()
  trigger?: string;
}

export class StreamChatRequestDto extends ChatRequestDto {
  @ApiProperty({ default: true })
  stream: boolean = true;
}

export class GenerateChatRequestDto extends ChatRequestDto {
  @ApiProperty({ default: false })
  stream: boolean = false;
}

@Exclude()
export class ChatUsageDto {
  @ApiProperty()
  @Expose()
  promptTokens: number;

  @ApiProperty()
  @Expose()
  completionTokens: number;

  @ApiProperty()
  @Expose()
  totalTokens: number;
}

@Exclude()
export class ChatResponseDto {
  @StringField()
  @Expose()
  id: string;

  @ApiProperty({ type: ChatMessageDto })
  @Type(() => ChatMessageDto)
  @Expose()
  message: ChatMessageDto;

  @ApiProperty({ type: ChatUsageDto, required: false })
  @Type(() => ChatUsageDto)
  @IsOptional()
  @Expose()
  usage?: ChatUsageDto;

  @StringFieldOptional()
  @Expose()
  finishReason?: string;
}

export class StreamChatDeltaDto {
  @ApiPropertyOptional({
    description: 'Delta content for the streaming response',
    example: 'Hello',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'Role of the message (only present in first delta)',
    enum: ['assistant'],
    example: 'assistant',
  })
  @IsOptional()
  @IsEnum(['assistant'])
  role?: 'assistant';

  @ApiPropertyOptional({
    description: 'Tool calls delta for streaming tool calls',
    type: [ToolCallDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ToolCallDto)
  toolCalls?: ToolCallDto[];
}

export class StreamChatResponseDto {
  @StringField()
  id: string;

  @ApiProperty({ type: StreamChatDeltaDto })
  @Type(() => StreamChatDeltaDto)
  delta: StreamChatDeltaDto;

  @StringFieldOptional()
  finishReason?: string;
}
