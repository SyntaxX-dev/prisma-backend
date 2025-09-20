import { ApiProperty } from '@nestjs/swagger';

export class CourseProgressResponseDto {
  @ApiProperty({
    description: 'ID do sub-curso',
    example: '86888b9e-e12f-4c6b-a3da-11b812a19a68',
  })
  subCourseId: string;

  @ApiProperty({
    description: 'Nome do sub-curso',
    example: 'Língua Portuguesa',
  })
  subCourseName: string;

  @ApiProperty({
    description: 'Total de vídeos no curso',
    example: 10,
  })
  totalVideos: number;

  @ApiProperty({
    description: 'Número de vídeos concluídos',
    example: 3,
  })
  completedVideos: number;

  @ApiProperty({
    description: 'Porcentagem de progresso do curso',
    example: 30,
  })
  progressPercentage: number;

  @ApiProperty({
    description: 'Se o curso foi concluído',
    example: false,
  })
  isCompleted: boolean;
}
