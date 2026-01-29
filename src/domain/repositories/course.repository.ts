import { Course } from '../entities/course';

export interface CourseRepository {
  create(
    course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Course>;
  findById(id: string): Promise<Course | null>;
  findByName(name: string): Promise<Course | null>;
  findAll(): Promise<Course[]>;
  findProducerCourses(): Promise<Course[]>;
  update(
    id: string,
    course: Partial<Omit<Course, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Course>;
  delete(id: string): Promise<void>;
}
