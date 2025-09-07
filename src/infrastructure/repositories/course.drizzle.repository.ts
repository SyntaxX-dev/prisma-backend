import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { CourseRepository } from '../../domain/repositories/course.repository';
import { Course } from '../../domain/entities/course';
import { DrizzleService } from '../config/providers/drizzle.service';
import { courses } from '../database/schema';

@Injectable()
export class CourseDrizzleRepository implements CourseRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(
    course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Course> {
    const [created] = await this.drizzleService.db
      .insert(courses)
      .values({
        name: course.name,
        description: course.description,
        imageUrl: course.imageUrl,
      })
      .returning();

    return new Course(
      created.id,
      created.name,
      created.description,
      created.imageUrl,
      created.createdAt,
      created.updatedAt,
    );
  }

  async findById(id: string): Promise<Course | null> {
    const [course] = await this.drizzleService.db
      .select()
      .from(courses)
      .where(eq(courses.id, id));

    if (!course) return null;

    return new Course(
      course.id,
      course.name,
      course.description,
      course.imageUrl,
      course.createdAt,
      course.updatedAt,
    );
  }

  async findByName(name: string): Promise<Course | null> {
    const [course] = await this.drizzleService.db
      .select()
      .from(courses)
      .where(eq(courses.name, name));

    if (!course) return null;

    return new Course(
      course.id,
      course.name,
      course.description,
      course.imageUrl,
      course.createdAt,
      course.updatedAt,
    );
  }

  async findAll(): Promise<Course[]> {
    const coursesList = await this.drizzleService.db
      .select()
      .from(courses)
      .orderBy(courses.createdAt);

    return coursesList.map(
      (course) =>
        new Course(
          course.id,
          course.name,
          course.description,
          course.imageUrl,
          course.createdAt,
          course.updatedAt,
        ),
    );
  }

  async update(
    id: string,
    course: Partial<Omit<Course, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Course> {
    const [updated] = await this.drizzleService.db
      .update(courses)
      .set({
        name: course.name,
        description: course.description,
        imageUrl: course.imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, id))
      .returning();

    return new Course(
      updated.id,
      updated.name,
      updated.description,
      updated.imageUrl,
      updated.createdAt,
      updated.updatedAt,
    );
  }

  async delete(id: string): Promise<void> {
    await this.drizzleService.db.delete(courses).where(eq(courses.id, id));
  }
}
