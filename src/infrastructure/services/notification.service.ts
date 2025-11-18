import { Injectable } from '@nestjs/common';
import {
  NotificationService,
  NotificationInfo,
} from '../../domain/services/notification.service';
import { User } from '../../domain/entities/user';

@Injectable()
export class NotificationServiceImpl implements NotificationService {
  checkUserNotifications(user: User): NotificationInfo {
    const missingFields: string[] = [];
    const completedFields: string[] = [];

    // Definir todos os campos do perfil com seus pesos
    const profileFields = [
      { key: 'name', label: 'nome', weight: 10, required: true },
      { key: 'email', label: 'email', weight: 10, required: true },
      { key: 'age', label: 'idade', weight: 10, required: true },
      {
        key: 'profileImage',
        label: 'foto do perfil',
        weight: 10,
        required: false,
      },
      { key: 'linkedin', label: 'LinkedIn', weight: 5, required: false },
      { key: 'github', label: 'GitHub', weight: 5, required: false },
      { key: 'portfolio', label: 'portfólio', weight: 5, required: false },
      { key: 'aboutYou', label: 'sobre você', weight: 15, required: false },
      { key: 'habilities', label: 'habilidades', weight: 15, required: false },
      {
        key: 'momentCareer',
        label: 'momento de carreira',
        weight: 10,
        required: false,
      },
      { key: 'location', label: 'localização', weight: 5, required: false },
      { key: 'userFocus', label: 'foco de estudo', weight: 10, required: true },
      {
        key: 'educationLevel',
        label: 'nível de educação',
        weight: 10,
        required: true,
      },
    ];

    let totalWeight = 0;
    let completedWeight = 0;

    // Verificar cada campo
    for (const field of profileFields) {
      const value = user[field.key as keyof User];
      const isCompleted = value !== null && value !== undefined && value !== '';

      if (isCompleted) {
        completedFields.push(field.label);
        completedWeight += field.weight;
      } else {
        // Adicionar TODOS os campos vazios ao missingFields
        missingFields.push(field.label);
      }

      totalWeight += field.weight;
    }

    // Verificar campos específicos baseados no foco (apenas para adicionar peso)
    if (user.userFocus === 'CONCURSO' && user.contestType) {
      completedWeight += 5;
      totalWeight += 5;
    } else if (user.userFocus === 'CONCURSO') {
      totalWeight += 5;
    }

    if (user.userFocus === 'FACULDADE' && user.collegeCourse) {
      completedWeight += 5;
      totalWeight += 5;
    } else if (user.userFocus === 'FACULDADE') {
      totalWeight += 5;
    }

    const profileCompletionPercentage = Math.round(
      (completedWeight / totalWeight) * 100,
    );
    const hasNotification = missingFields.length > 0;

    let message = '';
    if (hasNotification) {
      if (missingFields.length === 1) {
        message = `Complete seu perfil adicionando sua ${missingFields[0]}.`;
      } else {
        // Criar uma cópia do array para não modificar o original
        const fieldsCopy = [...missingFields];
        const lastField = fieldsCopy.pop();
        const otherFields = fieldsCopy.join(', ');
        message = `Complete seu perfil adicionando suas informações: ${otherFields} e ${lastField}.`;
      }
    } else {
      message = `Perfil ${profileCompletionPercentage}% completo!`;
    }

    return {
      hasNotification,
      missingFields,
      message,
      profileCompletionPercentage,
      completedFields,
    };
  }
}
