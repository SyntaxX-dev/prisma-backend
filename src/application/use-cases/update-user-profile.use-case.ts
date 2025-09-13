import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY, NOTIFICATION_SERVICE } from '../../domain/tokens';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { NotificationService } from '../../domain/services/notification.service';
import { UserFocus } from '../../domain/enums/user-focus';
import { ContestType } from '../../domain/enums/contest-type';
import { CollegeCourse } from '../../domain/enums/college-course';

export interface UpdateProfileInput {
  userId: string;
  name?: string;
  age?: number;
  educationLevel?: string;
  userFocus?: UserFocus;
  contestType?: ContestType;
  collegeCourse?: CollegeCourse;
}

export interface UpdateProfileOutput {
  success: boolean;
  message: string;
  badge?: string;
  hasNotification: boolean;
  missingFields: string[];
}

@Injectable()
export class UpdateUserProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(NOTIFICATION_SERVICE) private readonly notificationService: NotificationService,
  ) {}

  async execute(input: UpdateProfileInput): Promise<UpdateProfileOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Determinar o badge baseado no foco
    let badge: string | undefined;
    if (input.userFocus === UserFocus.ENEM) {
      badge = 'ENEM_BADGE';
    } else if (input.userFocus === UserFocus.CONCURSO && input.contestType) {
      badge = `${input.contestType}_BADGE`;
    } else if (input.userFocus === UserFocus.FACULDADE && input.collegeCourse) {
      badge = `${input.collegeCourse}_BADGE`;
    } else if (input.userFocus === UserFocus.ENSINO_MEDIO) {
      badge = 'ENSINO_MEDIO_BADGE';
    }

    // Atualizar perfil
    const updatedUser = {
      ...user,
      name: input.name ?? user.name,
      age: input.age ?? user.age,
      educationLevel: input.educationLevel as any ?? user.educationLevel,
      userFocus: input.userFocus ?? user.userFocus,
      contestType: input.contestType ?? user.contestType,
      collegeCourse: input.collegeCourse ?? user.collegeCourse,
      badge: badge ?? user.badge,
    };

    // Verificar se o perfil está completo
    const notificationInfo = this.notificationService.checkUserNotifications(updatedUser);
    updatedUser.isProfileComplete = !notificationInfo.hasNotification;

    await this.userRepository.updateProfile(input.userId, updatedUser);

    return {
      success: true,
      message: 'Perfil atualizado com sucesso',
      badge: updatedUser.badge || undefined,
      hasNotification: notificationInfo.hasNotification,
      missingFields: notificationInfo.missingFields,
    };
  }
}
