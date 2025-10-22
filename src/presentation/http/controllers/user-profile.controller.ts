import { 
  Controller, 
  Put, 
  Post,
  Delete,
  Body, 
  UseGuards, 
  Request, 
  HttpException, 
  HttpStatus,
  ConflictException,
  BadRequestException,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { UpdateAboutYouDto } from '../dtos/update-about-you.dto';
import { UpdateHabilitiesDto } from '../dtos/update-habilities.dto';
import { UpdateMomentCareerDto } from '../dtos/update-moment-career.dto';
import { UpdateLocationDto } from '../dtos/update-location.dto';
import { UploadProfileImageDto } from '../dtos/upload-profile-image.dto';
import { CloudinaryService } from '../../../infrastructure/services/cloudinary.service';

@ApiTags('User Profile')
@Controller('user-profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UserProfileController {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    private readonly cloudinaryService: CloudinaryService,
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

  @Post('profile-image/upload')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload de foto do perfil' })
  @ApiResponse({ 
    status: 200, 
    description: 'Foto do perfil enviada com sucesso',
    schema: {
      example: {
        success: true,
        message: 'Foto do perfil enviada com sucesso',
        data: {
          profileImage: 'https://res.cloudinary.com/dgdefptw3/image/upload/v1234567890/profile-images/abc123.jpg'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Erro no upload da imagem',
    schema: {
      example: {
        success: false,
        message: 'Erro ao fazer upload da imagem: Invalid file format'
      }
    }
  })
  async uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const userId = req.user.sub;

    if (!file) {
      throw new HttpException('Nenhum arquivo foi enviado', HttpStatus.BAD_REQUEST);
    }

    // Validar tipo de arquivo
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new HttpException('Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP', HttpStatus.BAD_REQUEST);
    }

    // Validar tamanho do arquivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new HttpException('Arquivo muito grande. Tamanho máximo: 5MB', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    try {
      // Fazer upload para o Cloudinary
      const imageUrl = await this.cloudinaryService.uploadProfileImage(file);

      // Atualizar no banco de dados
      await this.userRepository.updateProfile(userId, { profileImage: imageUrl });

      return {
        success: true,
        message: 'Foto do perfil enviada com sucesso',
        data: {
          profileImage: imageUrl
        }
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao fazer upload da imagem: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('profile-image')
  @ApiOperation({ summary: 'Remover foto do perfil' })
  @ApiResponse({ 
    status: 200, 
    description: 'Foto do perfil removida com sucesso',
    schema: {
      example: {
        success: true,
        message: 'Foto do perfil removida com sucesso'
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Usuário não encontrado',
    schema: {
      example: {
        success: false,
        message: 'Usuário não encontrado'
      }
    }
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Erro ao remover a imagem',
    schema: {
      example: {
        success: false,
        message: 'Erro ao remover a imagem: Erro interno do servidor'
      }
    }
  })
  async removeProfileImage(@Request() req: any) {
    const userId = req.user.sub;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    // Se o usuário não tem foto de perfil, retorna sucesso
    if (!user.profileImage) {
      return {
        success: true,
        message: 'Usuário não possui foto de perfil para remover'
      };
    }

    try {
      // Extrair o public ID da URL do Cloudinary
      const publicId = this.cloudinaryService.extractPublicIdFromUrl(user.profileImage);
      
      // Se conseguiu extrair o public ID, deletar a imagem do Cloudinary
      if (publicId) {
        await this.cloudinaryService.deleteImage(publicId);
      }

      // Remover a URL da imagem do banco de dados
      await this.userRepository.updateProfile(userId, { profileImage: null });

      return {
        success: true,
        message: 'Foto do perfil removida com sucesso'
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao remover a imagem: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
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

  @Put('about-you')
  @ApiOperation({ summary: 'Atualizar texto sobre você (opcional)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Texto sobre você atualizado com sucesso',
    schema: {
      example: {
        success: true,
        message: 'Texto sobre você atualizado com sucesso',
        data: {
          aboutYou: 'Desenvolvedor apaixonado por tecnologia e inovação'
        }
      }
    }
  })
  async updateAboutYou(
    @Request() req: any,
    @Body() updateAboutYouDto: UpdateAboutYouDto,
  ) {
    const userId = req.user.sub;
    const { aboutYou } = updateAboutYouDto;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    // Atualizar apenas o texto sobre você
    await this.userRepository.updateProfile(userId, { aboutYou });

    return {
      success: true,
      message: 'Texto sobre você atualizado com sucesso',
      data: {
        aboutYou: aboutYou
      }
    };
  }

  @Put('habilities')
  @ApiOperation({ summary: 'Atualizar habilidades do usuário (array de strings opcional)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Habilidades atualizadas com sucesso',
    schema: {
      example: {
        success: true,
        message: 'Habilidades atualizadas com sucesso',
        data: {
          habilities: ["JavaScript", "React", "Node.js", "TypeScript", "Python"]
        }
      }
    }
  })
  async updateHabilities(
    @Request() req: any,
    @Body() updateHabilitiesDto: UpdateHabilitiesDto,
  ) {
    const userId = req.user.sub;
    const { habilities } = updateHabilitiesDto;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    // Converter array para string separada por vírgulas ou null se não fornecido
    const habilitiesString = habilities ? habilities.join(', ') : null;

    // Atualizar apenas as habilidades
    await this.userRepository.updateProfile(userId, { habilities: habilitiesString });

    return {
      success: true,
      message: 'Habilidades atualizadas com sucesso',
      data: {
        habilities: habilities || null
      }
    };
  }

  @Put('moment-career')
  @ApiOperation({ summary: 'Atualizar momento de carreira do usuário (opcional)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Momento de carreira atualizado com sucesso',
    schema: {
      example: {
        success: true,
        message: 'Momento de carreira atualizado com sucesso',
        data: {
          momentCareer: 'Iniciando carreira em desenvolvimento web'
        }
      }
    }
  })
  async updateMomentCareer(
    @Request() req: any,
    @Body() updateMomentCareerDto: UpdateMomentCareerDto,
  ) {
    const userId = req.user.sub;
    const { momentCareer } = updateMomentCareerDto;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    // Atualizar apenas o momento de carreira
    await this.userRepository.updateProfile(userId, { momentCareer: momentCareer || null });

    return {
      success: true,
      message: 'Momento de carreira atualizado com sucesso',
      data: {
        momentCareer: momentCareer || null
      }
    };
  }

  @Put('location')
  @ApiOperation({ summary: 'Atualizar localização do usuário (opcional)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Localização atualizada com sucesso',
    schema: {
      example: {
        success: true,
        message: 'Localização atualizada com sucesso',
        data: {
          location: 'São Paulo, SP, Brasil'
        }
      }
    }
  })
  async updateLocation(
    @Request() req: any,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    const userId = req.user.sub;
    const { location } = updateLocationDto;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    // Atualizar apenas a localização
    await this.userRepository.updateProfile(userId, { location: location || null });

    return {
      success: true,
      message: 'Localização atualizada com sucesso',
      data: {
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
