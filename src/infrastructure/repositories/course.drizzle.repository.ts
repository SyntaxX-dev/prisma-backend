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
        isPaid: course.isPaid ? 'true' : 'false',
        isProducerCourse: course.isProducerCourse ? 'true' : 'false',
      })
      .returning();

    return new Course(
      created.id,
      created.name,
      created.description,
      created.imageUrl,
      created.isPaid === 'true',
      created.isProducerCourse === 'true',
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
      course.isPaid === 'true',
      course.isProducerCourse === 'true',
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
      course.isPaid === 'true',
      course.isProducerCourse === 'true',
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
          course.isPaid === 'true',
          course.isProducerCourse === 'true',
          course.createdAt,
          course.updatedAt,
        ),
    );
  }

  async findProducerCourses(): Promise<Course[]> {
    const producerCourses = await this.drizzleService.db
      .select()
      .from(courses)
      .where(eq(courses.isProducerCourse, 'true'))
      .orderBy(courses.createdAt);

    return producerCourses.map(
      (course) =>
        new Course(
          course.id,
          course.name,
          course.description,
          course.imageUrl,
          course.isPaid === 'true',
          course.isProducerCourse === 'true',
          course.createdAt,
          course.updatedAt,
        ),
    );
  }

  async update(
    id: string,
    course: Partial<Omit<Course, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Course> {
    const updateData: Partial<typeof courses.$inferInsert> = {};

    if (typeof course.name !== 'undefined') {
      updateData.name = course.name;
    }
    if (typeof course.description !== 'undefined') {
      updateData.description = course.description;
    }
    if (typeof course.imageUrl !== 'undefined') {
      updateData.imageUrl = course.imageUrl;
    }
    if (typeof course.isPaid !== 'undefined') {
      updateData.isPaid = course.isPaid ? 'true' : 'false';
    }
    if (typeof course.isProducerCourse !== 'undefined') {
      updateData.isProducerCourse = course.isProducerCourse ? 'true' : 'false';
    }

    updateData.updatedAt = new Date();

    const [updated] = await this.drizzleService.db
      .update(courses)
      .set(updateData)
      .where(eq(courses.id, id))
      .returning();

    return new Course(
      updated.id,
      updated.name,
      updated.description,
      updated.imageUrl,
      updated.isPaid === 'true',
      updated.isProducerCourse === 'true',
      updated.createdAt,
      updated.updatedAt,
    );
  }

  async delete(id: string): Promise<void> {
    await this.drizzleService.db.delete(courses).where(eq(courses.id, id));
  }
}
