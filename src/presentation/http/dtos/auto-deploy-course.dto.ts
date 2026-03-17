import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class AutoDeployCourseDto {
  @ApiProperty({
    description: 'Tópico do curso que você quer criar (ex: "Curso de História")',
    example: 'Curso Completo de React 2024',
  })
  @IsString()
  @IsNotEmpty({ message: 'O tópico é obrigatório' })
  topic: string;

  @ApiProperty({
    description: 'Máximo de subcursos (playlists) a serem incluídos',
    example: 5,
    default: 5,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxSubCourses?: number;

  @ApiProperty({
    description: 'Prompt personalizado para orientar a IA na escolha e organização',
    example: 'Foque em conteúdos para iniciantes no estilo "do zero ao avançado"',
    required: false,
  })
  @IsOptional()
  @IsString()
  aiPrompt?: string;

  @ApiProperty({
    description: 'ID do curso existente para vincular (opcional). Se não informado, a IA criará um novo curso com o nome do tópico.',
    example: 'uuid-do-curso',
    required: false,
  })
  @IsOptional()
  @IsString()
  courseId?: string;
}
