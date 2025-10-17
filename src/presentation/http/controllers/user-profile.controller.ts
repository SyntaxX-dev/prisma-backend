import { 
  Controller, 
  Put, 
  Body, 
  UseGuards, 
  Request, 
  HttpException, 
  HttpStatus,
  ConflictException,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { USER_REPOSITORY } from '../../../domain/tokens';
import { Inject } from '@nestjs/common';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import { UpdateNameDto } from '../dtos/update-name.dto';
import { UpdateAgeDto } from '../dtos/update-age.dto';
import { UpdateProfileImageDto } from '../dtos/update-profile-image.dto';
import { UpdateLinksDto } from '../dtos/update-links.dto';
import { UpdateAboutDto } from '../dtos/update-about.dto';

@ApiTags('User Profile')
@Controller('user-profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UserProfileController {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  @Put('name')
  @ApiOperation({ summary: 'Atualizar nome do usuário' })
  @ApiResponse({ 
    status: 200, 
    description: 'Nome atualizado com sucesso',
    schema: {
      example: {
        success: true,
        message: 'Nome atualizado com sucesso',
        data: {
          name: 'João Silva'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Nome já existe na plataforma',
    schema: {
      example: {
        success: false,
        message: 'Este nome já está sendo usado por outro usuário'
      }
    }
  })
  async updateName(
    @Request() req: any,
    @Body() updateNameDto: UpdateNameDto,
  ) {
    const userId = req.user.sub;
    const { name } = updateNameDto;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    // Verificar se o nome já existe (exceto para o próprio usuário)
    const existingUser = await this.userRepository.findByName(name);
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('Este nome já está sendo usado por outro usuário');
    }

    // Atualizar apenas o nome
    await this.userRepository.updateProfile(userId, { name });

    return {
      success: true,
      message: 'Nome atualizado com sucesso',
      data: {
        name: name
      }
    };
  }

  @Put('age')
  @ApiOperation({ summary: 'Atualizar idade do usuário' })
  @ApiResponse({ 
    status: 200, 
    description: 'Idade atualizada com sucesso',
    schema: {
      example: {
        success: true,
        message: 'Idade atualizada com sucesso',
        data: {
          age: 25
        }
      }
    }
  })
  async updateAge(
    @Request() req: any,
    @Body() updateAgeDto: UpdateAgeDto,
  ) {
    const userId = req.user.sub;
    const { age } = updateAgeDto;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    // Atualizar apenas a idade
    await this.userRepository.updateProfile(userId, { age });

    return {
      success: true,
      message: 'Idade atualizada com sucesso',
      data: {
        age: age
      }
    };
  }

  @Put('profile-image')
  @ApiOperation({ summary: 'Atualizar foto do perfil' })
  @ApiResponse({ 
    status: 200, 
    description: 'Foto do perfil atualizada com sucesso',
    schema: {
      example: {
        success: true,
        message: 'Foto do perfil atualizada com sucesso',
        data: {
          profileImage: 'https://exemplo.com/foto.jpg'
        }
      }
    }
  })
  async updateProfileImage(
    @Request() req: any,
    @Body() updateProfileImageDto: UpdateProfileImageDto,
  ) {
    const userId = req.user.sub;
    const { profileImage } = updateProfileImageDto;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    // Atualizar apenas a foto do perfil
    await this.userRepository.updateProfile(userId, { profileImage });

    return {
      success: true,
      message: 'Foto do perfil atualizada com sucesso',
      data: {
        profileImage: profileImage
      }
    };
  }

  @Put('links')
  @ApiOperation({ summary: 'Atualizar links do usuário (LinkedIn, GitHub, Portfolio)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Links atualizados com sucesso',
    schema: {
      example: {
        success: true,
        message: 'Links atualizados com sucesso',
        data: {
          linkedin: 'https://linkedin.com/in/joao',
          github: 'https://github.com/joao',
          portfolio: 'https://joao.dev'
        }
      }
    }
  })
  async updateLinks(
    @Request() req: any,
    @Body() updateLinksDto: UpdateLinksDto,
  ) {
    const userId = req.user.sub;
    const { linkedin, github, portfolio } = updateLinksDto;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    // Atualizar apenas os links
    await this.userRepository.updateProfile(userId, { 
      linkedin: linkedin || null,
      github: github || null,
      portfolio: portfolio || null
    });

    return {
      success: true,
      message: 'Links atualizados com sucesso',
      data: {
        linkedin: linkedin || null,
        github: github || null,
        portfolio: portfolio || null
      }
    };
  }

  @Put('about')
  @ApiOperation({ summary: 'Atualizar informações sobre o usuário' })
  @ApiResponse({ 
    status: 200, 
    description: 'Informações atualizadas com sucesso',
    schema: {
      example: {
        success: true,
        message: 'Informações atualizadas com sucesso',
        data: {
          aboutYou: 'Desenvolvedor apaixonado por tecnologia',
          habilities: 'JavaScript, React, Node.js',
          momentCareer: 'Iniciando carreira em desenvolvimento',
          location: 'São Paulo, SP'
        }
      }
    }
  })
  async updateAbout(
    @Request() req: any,
    @Body() updateAboutDto: UpdateAboutDto,
  ) {
    const userId = req.user.sub;
    const { aboutYou, habilities, momentCareer, location } = updateAboutDto;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    // Atualizar apenas as informações sobre o usuário
    await this.userRepository.updateProfile(userId, { 
      aboutYou: aboutYou || null,
      habilities: habilities || null,
      momentCareer: momentCareer || null,
      location: location || null
    });

    return {
      success: true,
      message: 'Informações atualizadas com sucesso',
      data: {
        aboutYou: aboutYou || null,
        habilities: habilities || null,
        momentCareer: momentCareer || null,
        location: location || null
      }
    };
  }

  @Put('email')
  @ApiOperation({ summary: 'Email não pode ser editado' })
  @ApiResponse({ 
    status: 403, 
    description: 'Email não pode ser editado',
    schema: {
      example: {
        success: false,
        message: 'Email não pode ser editado',
        field: 'email',
        readonly: true,
        tag: 'READONLY_FIELD'
      }
    }
  })
  async updateEmail() {
    throw new HttpException({
      success: false,
      message: 'Email não pode ser editado',
      field: 'email',
      readonly: true,
      tag: 'READONLY_FIELD'
    }, HttpStatus.FORBIDDEN);
  }
}
