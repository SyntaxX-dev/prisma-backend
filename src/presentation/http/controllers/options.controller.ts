import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ListContestsUseCase } from '../../../application/use-cases/list-contests.use-case';
import { ListCollegeCoursesUseCase } from '../../../application/use-cases/list-college-courses.use-case';

@ApiTags('Options')
@Controller('options')
export class OptionsController {
  constructor(
    private readonly listContestsUseCase: ListContestsUseCase,
    private readonly listCollegeCoursesUseCase: ListCollegeCoursesUseCase,
  ) {}

  @Get('contests')
  @ApiOperation({ summary: 'Listar concursos disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de concursos retornada com sucesso' })
  async listContests() {
    return await this.listContestsUseCase.execute();
  }

  @Get('college-courses')
  @ApiOperation({ summary: 'Listar cursos de faculdade disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de cursos retornada com sucesso' })
  async listCollegeCourses() {
    return await this.listCollegeCoursesUseCase.execute();
  }
}
