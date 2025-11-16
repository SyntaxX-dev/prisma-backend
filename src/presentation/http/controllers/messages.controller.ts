import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { SendMessageUseCase } from '../../../application/messages/use-cases/send-message.use-case';
import { GetMessagesUseCase } from '../../../application/messages/use-cases/get-messages.use-case';
import { MarkMessagesAsReadUseCase } from '../../../application/messages/use-cases/mark-messages-as-read.use-case';
import { GetUnreadCountUseCase } from '../../../application/messages/use-cases/get-unread-count.use-case';
import { ListConversationsUseCase } from '../../../application/messages/use-cases/list-conversations.use-case';
import { PinMessageUseCase } from '../../../application/messages/use-cases/pin-message.use-case';
import { UnpinMessageUseCase } from '../../../application/messages/use-cases/unpin-message.use-case';
import { GetPinnedMessagesUseCase } from '../../../application/messages/use-cases/get-pinned-messages.use-case';
import { EditMessageUseCase } from '../../../application/messages/use-cases/edit-message.use-case';
import { DeleteMessageUseCase } from '../../../application/messages/use-cases/delete-message.use-case';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MessagesController {
  constructor(
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly getMessagesUseCase: GetMessagesUseCase,
    private readonly markMessagesAsReadUseCase: MarkMessagesAsReadUseCase,
    private readonly getUnreadCountUseCase: GetUnreadCountUseCase,
    private readonly listConversationsUseCase: ListConversationsUseCase,
    private readonly pinMessageUseCase: PinMessageUseCase,
    private readonly unpinMessageUseCase: UnpinMessageUseCase,
    private readonly getPinnedMessagesUseCase: GetPinnedMessagesUseCase,
    private readonly editMessageUseCase: EditMessageUseCase,
    private readonly deleteMessageUseCase: DeleteMessageUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Enviar mensagem' })
  @ApiResponse({ status: 200, description: 'Mensagem enviada com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao enviar mensagem' })
  async sendMessage(
    @Request() req: any,
    @Body() body: { receiverId: string; content: string },
  ) {
    try {
      const result = await this.sendMessageUseCase.execute({
        senderId: req.user.sub,
        receiverId: body.receiverId,
        content: body.content,
      });

      return {
        success: result.success,
        data: result.message,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('conversation/:friendId')
  @ApiOperation({ summary: 'Buscar mensagens de uma conversa' })
  @ApiResponse({ status: 200, description: 'Mensagens retornadas com sucesso' })
  async getMessages(
    @Request() req: any,
    @Param('friendId') friendId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const result = await this.getMessagesUseCase.execute({
        userId: req.user.sub,
        friendId,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('read/:senderId')
  @ApiOperation({ summary: 'Marcar mensagens como lidas' })
  @ApiResponse({ status: 200, description: 'Mensagens marcadas como lidas' })
  async markAsRead(@Request() req: any, @Param('senderId') senderId: string) {
    try {
      const result = await this.markMessagesAsReadUseCase.execute({
        userId: req.user.sub,
        senderId,
      });

      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Contar mensagens não lidas' })
  @ApiResponse({ status: 200, description: 'Contagem de mensagens não lidas' })
  async getUnreadCount(@Request() req: any) {
    try {
      const result = await this.getUnreadCountUseCase.execute({
        userId: req.user.sub,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Listar todas as conversas do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Lista de conversas retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            conversations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  otherUser: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      email: { type: 'string' },
                      profileImage: { type: 'string', nullable: true },
                    },
                  },
                  lastMessage: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      content: { type: 'string' },
                      senderId: { type: 'string' },
                      receiverId: { type: 'string' },
                      isRead: { type: 'boolean' },
                      createdAt: { type: 'string', format: 'date-time' },
                      readAt: { type: 'string', format: 'date-time', nullable: true },
                    },
                  },
                  unreadCount: { type: 'number' },
                  isFromMe: { type: 'boolean' },
                },
              },
            },
            total: { type: 'number' },
          },
        },
      },
    },
  })
  async listConversations(@Request() req: any) {
    try {
      const result = await this.listConversationsUseCase.execute({
        userId: req.user.sub,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':messageId/pin')
  @ApiOperation({ summary: 'Fixar uma mensagem em uma conversa' })
  @ApiResponse({ status: 200, description: 'Mensagem fixada com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao fixar mensagem' })
  @ApiResponse({ status: 404, description: 'Mensagem não encontrada' })
  async pinMessage(
    @Request() req: any,
    @Param('messageId') messageId: string,
    @Body() body: { friendId: string },
  ) {
    try {
      const result = await this.pinMessageUseCase.execute({
        messageId,
        userId: req.user.sub,
        friendId: body.friendId,
      });

      return {
        success: result.success,
        data: result.pinnedMessage,
      };
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : error.message.includes('não encontrada') || error.message.includes('não encontrado')
            ? HttpStatus.NOT_FOUND
            : HttpStatus.BAD_REQUEST;

      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        status,
      );
    }
  }

  @Delete(':messageId/unpin')
  @ApiOperation({ summary: 'Desfixar uma mensagem' })
  @ApiResponse({ status: 200, description: 'Mensagem desfixada com sucesso' })
  @ApiResponse({ status: 404, description: 'Mensagem não está fixada' })
  async unpinMessage(@Request() req: any, @Param('messageId') messageId: string) {
    try {
      const result = await this.unpinMessageUseCase.execute({
        messageId,
        userId: req.user.sub,
      });

      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : error.message.includes('não encontrada') || error.message.includes('não está fixada')
            ? HttpStatus.NOT_FOUND
            : HttpStatus.BAD_REQUEST;

      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        status,
      );
    }
  }

  @Get('conversation/:friendId/pinned')
  @ApiOperation({ summary: 'Listar mensagens fixadas de uma conversa' })
  @ApiResponse({
    status: 200,
    description: 'Mensagens fixadas retornadas com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              messageId: { type: 'string' },
              pinnedBy: { type: 'string' },
              pinnedByUserName: { type: 'string' },
              pinnedAt: { type: 'string', format: 'date-time' },
              timeSincePinned: { type: 'string' },
              message: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  content: { type: 'string' },
                  senderId: { type: 'string' },
                  receiverId: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
  })
  async getPinnedMessages(@Request() req: any, @Param('friendId') friendId: string) {
    try {
      const result = await this.getPinnedMessagesUseCase.execute({
        userId: req.user.sub,
        friendId,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':messageId')
  @ApiOperation({ summary: 'Editar uma mensagem' })
  @ApiResponse({ status: 200, description: 'Mensagem editada com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao editar mensagem (tempo limite excedido, conteúdo inválido)' })
  @ApiResponse({ status: 403, description: 'Você não pode editar mensagens de outros usuários' })
  @ApiResponse({ status: 404, description: 'Mensagem não encontrada' })
  async editMessage(
    @Request() req: any,
    @Param('messageId') messageId: string,
    @Body() body: { content: string },
  ) {
    try {
      const result = await this.editMessageUseCase.execute({
        messageId,
        userId: req.user.sub,
        newContent: body.content,
      });

      return {
        success: result.success,
        data: result.message,
      };
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : error.message.includes('não encontrada') || error.message.includes('não encontrado')
            ? HttpStatus.NOT_FOUND
            : error.message.includes('só pode editar') || error.message.includes('não pode')
              ? HttpStatus.FORBIDDEN
              : HttpStatus.BAD_REQUEST;

      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        status,
      );
    }
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'Excluir uma mensagem' })
  @ApiResponse({ status: 200, description: 'Mensagem excluída com sucesso' })
  @ApiResponse({ status: 403, description: 'Você não pode excluir mensagens de outros usuários' })
  @ApiResponse({ status: 404, description: 'Mensagem não encontrada' })
  async deleteMessage(@Request() req: any, @Param('messageId') messageId: string) {
    try {
      const result = await this.deleteMessageUseCase.execute({
        messageId,
        userId: req.user.sub,
      });

      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      const status =
        error instanceof HttpException
          ? error.getStatus()
          : error.message.includes('não encontrada') || error.message.includes('não encontrado')
            ? HttpStatus.NOT_FOUND
            : error.message.includes('só pode excluir') || error.message.includes('não pode')
              ? HttpStatus.FORBIDDEN
              : HttpStatus.BAD_REQUEST;

      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        status,
      );
    }
  }
}

