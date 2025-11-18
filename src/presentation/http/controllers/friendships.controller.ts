import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { SendFriendRequestUseCase } from '../../../application/friendships/use-cases/send-friend-request.use-case';
import { AcceptFriendRequestUseCase } from '../../../application/friendships/use-cases/accept-friend-request.use-case';
import { RejectFriendRequestUseCase } from '../../../application/friendships/use-cases/reject-friend-request.use-case';
import { BlockUserUseCase } from '../../../application/friendships/use-cases/block-user.use-case';
import { UnblockUserUseCase } from '../../../application/friendships/use-cases/unblock-user.use-case';
import { UnfriendUserUseCase } from '../../../application/friendships/use-cases/unfriend-user.use-case';
import { ListFriendsUseCase } from '../../../application/friendships/use-cases/list-friends.use-case';
import { ListFriendRequestsUseCase } from '../../../application/friendships/use-cases/list-friend-requests.use-case';
import { FriendRequestStatus } from '../../../domain/enums/friend-request-status';

@ApiTags('Friendships')
@Controller('friendships')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FriendshipsController {
  constructor(
    private readonly sendFriendRequestUseCase: SendFriendRequestUseCase,
    private readonly acceptFriendRequestUseCase: AcceptFriendRequestUseCase,
    private readonly rejectFriendRequestUseCase: RejectFriendRequestUseCase,
    private readonly blockUserUseCase: BlockUserUseCase,
    private readonly unblockUserUseCase: UnblockUserUseCase,
    private readonly unfriendUserUseCase: UnfriendUserUseCase,
    private readonly listFriendsUseCase: ListFriendsUseCase,
    private readonly listFriendRequestsUseCase: ListFriendRequestsUseCase,
  ) {}

  @Post('requests')
  @ApiOperation({ summary: 'Enviar pedido de amizade' })
  @ApiResponse({
    status: 201,
    description: 'Pedido de amizade enviado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Erro ao enviar pedido' })
  async sendFriendRequest(
    @Request() req: any,
    @Body() body: { receiverId: string },
  ) {
    const result = await this.sendFriendRequestUseCase.execute({
      requesterId: req.user.sub,
      receiverId: body.receiverId,
    });

    return {
      success: result.success,
      message: result.message,
      data: result.friendRequest,
    };
  }

  @Post('requests/:id/accept')
  @ApiOperation({ summary: 'Aceitar pedido de amizade' })
  @ApiResponse({
    status: 200,
    description: 'Pedido de amizade aceito com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Erro ao aceitar pedido' })
  async acceptFriendRequest(
    @Request() req: any,
    @Param('id') friendRequestId: string,
  ) {
    const result = await this.acceptFriendRequestUseCase.execute({
      userId: req.user.sub,
      friendRequestId,
    });

    return {
      success: result.success,
      message: result.message,
      data: result.friendship,
    };
  }

  @Post('requests/:id/reject')
  @ApiOperation({ summary: 'Rejeitar pedido de amizade' })
  @ApiResponse({ status: 200, description: 'Pedido de amizade rejeitado' })
  @ApiResponse({ status: 400, description: 'Erro ao rejeitar pedido' })
  async rejectFriendRequest(
    @Request() req: any,
    @Param('id') friendRequestId: string,
  ) {
    const result = await this.rejectFriendRequestUseCase.execute({
      userId: req.user.sub,
      friendRequestId,
    });

    return {
      success: result.success,
      message: result.message,
    };
  }

  @Get('requests')
  @ApiOperation({ summary: 'Listar pedidos de amizade' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos de amizade' })
  async listFriendRequests(
    @Request() req: any,
    @Query('type') type?: 'received' | 'sent',
    @Query('status') status?: string,
  ) {
    const result = await this.listFriendRequestsUseCase.execute({
      userId: req.user.sub,
      type: type || 'received',
      status: status
        ? (status as FriendRequestStatus)
        : FriendRequestStatus.PENDING,
    });

    return {
      success: true,
      data: result.requests,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar amigos' })
  @ApiResponse({ status: 200, description: 'Lista de amigos' })
  async listFriends(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.listFriendsUseCase.execute({
      userId: req.user.sub,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return {
      success: true,
      data: result,
    };
  }

  @Post('block')
  @ApiOperation({ summary: 'Bloquear usuário' })
  @ApiResponse({ status: 200, description: 'Usuário bloqueado com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao bloquear usuário' })
  async blockUser(@Request() req: any, @Body() body: { blockedId: string }) {
    const result = await this.blockUserUseCase.execute({
      blockerId: req.user.sub,
      blockedId: body.blockedId,
    });

    return {
      success: result.success,
      message: result.message,
    };
  }

  @Delete('block/:blockedId')
  @ApiOperation({ summary: 'Desbloquear usuário' })
  @ApiResponse({ status: 200, description: 'Usuário desbloqueado com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao desbloquear usuário' })
  async unblockUser(
    @Request() req: any,
    @Param('blockedId') blockedId: string,
  ) {
    const result = await this.unblockUserUseCase.execute({
      blockerId: req.user.sub,
      blockedId,
    });

    return {
      success: result.success,
      message: result.message,
    };
  }

  @Delete(':friendId')
  @ApiOperation({ summary: 'Desfazer amizade' })
  @ApiResponse({ status: 200, description: 'Amizade desfeita com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro ao desfazer amizade' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async unfriendUser(@Request() req: any, @Param('friendId') friendId: string) {
    const result = await this.unfriendUserUseCase.execute({
      userId: req.user.sub,
      friendId,
    });

    return {
      success: result.success,
      message: result.message,
    };
  }
}
