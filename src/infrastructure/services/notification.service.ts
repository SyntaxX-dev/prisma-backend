import { Injectable } from '@nestjs/common';
import { NotificationService, NotificationInfo } from '../../domain/services/notification.service';
import { User } from '../../domain/entities/user';

@Injectable()
export class NotificationServiceImpl implements NotificationService {
  checkUserNotifications(user: User): NotificationInfo {
    const missingFields: string[] = [];
    
    // Verificar campos obrigatórios para perfil completo
    if (!user.age) missingFields.push('idade');
    if (!user.educationLevel) missingFields.push('nível de educação');
    if (!user.userFocus) missingFields.push('foco de estudo');
    
    // Verificar campos específicos baseados no foco
    if (user.userFocus === 'CONCURSO' && !user.contestType) {
      missingFields.push('tipo de concurso');
    }
    
    if (user.userFocus === 'FACULDADE' && !user.collegeCourse) {
      missingFields.push('curso de faculdade');
    }
    
    const hasNotification = missingFields.length > 0;
    
    let message = '';
    if (hasNotification) {
      if (missingFields.length === 1) {
        message = `Complete seu perfil adicionando sua ${missingFields[0]}.`;
      } else {
        const lastField = missingFields.pop();
        const otherFields = missingFields.join(', ');
        message = `Complete seu perfil adicionando suas informações: ${otherFields} e ${lastField}.`;
      }
    }
    
    return {
      hasNotification,
      missingFields,
      message,
    };
  }
}
