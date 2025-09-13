import { Injectable } from '@nestjs/common';
import { CollegeCourse } from '../../domain/enums/college-course';

export interface CollegeCourseOption {
  value: CollegeCourse;
  label: string;
  description: string;
}

export interface ListCollegeCoursesOutput {
  courses: CollegeCourseOption[];
}

@Injectable()
export class ListCollegeCoursesUseCase {
  async execute(): Promise<ListCollegeCoursesOutput> {
    const courses: CollegeCourseOption[] = [
      {
        value: CollegeCourse.MEDICINA,
        label: 'Medicina',
        description: 'Curso de Medicina',
      },
      {
        value: CollegeCourse.ENGENHARIA,
        label: 'Engenharia',
        description: 'Curso de Engenharia',
      },
      {
        value: CollegeCourse.DIREITO,
        label: 'Direito',
        description: 'Curso de Direito',
      },
      {
        value: CollegeCourse.ADMINISTRACAO,
        label: 'Administração',
        description: 'Curso de Administração',
      },
      {
        value: CollegeCourse.CONTABILIDADE,
        label: 'Contabilidade',
        description: 'Curso de Contabilidade',
      },
      {
        value: CollegeCourse.PSICOLOGIA,
        label: 'Psicologia',
        description: 'Curso de Psicologia',
      },
      {
        value: CollegeCourse.PEDAGOGIA,
        label: 'Pedagogia',
        description: 'Curso de Pedagogia',
      },
      {
        value: CollegeCourse.ENFERMAGEM,
        label: 'Enfermagem',
        description: 'Curso de Enfermagem',
      },
      {
        value: CollegeCourse.FARMACIA,
        label: 'Farmácia',
        description: 'Curso de Farmácia',
      },
      {
        value: CollegeCourse.FISIOTERAPIA,
        label: 'Fisioterapia',
        description: 'Curso de Fisioterapia',
      },
      {
        value: CollegeCourse.ODONTOLOGIA,
        label: 'Odontologia',
        description: 'Curso de Odontologia',
      },
      {
        value: CollegeCourse.VETERINARIA,
        label: 'Veterinária',
        description: 'Curso de Veterinária',
      },
      {
        value: CollegeCourse.ARQUITETURA,
        label: 'Arquitetura',
        description: 'Curso de Arquitetura',
      },
      {
        value: CollegeCourse.CIENCIA_COMPUTACAO,
        label: 'Ciência da Computação',
        description: 'Curso de Ciência da Computação',
      },
      {
        value: CollegeCourse.SISTEMAS_INFORMACAO,
        label: 'Sistemas de Informação',
        description: 'Curso de Sistemas de Informação',
      },
      {
        value: CollegeCourse.JORNALISMO,
        label: 'Jornalismo',
        description: 'Curso de Jornalismo',
      },
      {
        value: CollegeCourse.PUBLICIDADE,
        label: 'Publicidade',
        description: 'Curso de Publicidade',
      },
      {
        value: CollegeCourse.MARKETING,
        label: 'Marketing',
        description: 'Curso de Marketing',
      },
      {
        value: CollegeCourse.ECONOMIA,
        label: 'Economia',
        description: 'Curso de Economia',
      },
      {
        value: CollegeCourse.RELACOES_INTERNACIONAIS,
        label: 'Relações Internacionais',
        description: 'Curso de Relações Internacionais',
      },
      {
        value: CollegeCourse.OUTROS,
        label: 'Outros Cursos',
        description: 'Outros cursos de faculdade',
      },
    ];

    return { courses };
  }
}
