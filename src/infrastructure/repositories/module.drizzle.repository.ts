import { Injectable } from '@nestjs/common';
import { eq, count } from 'drizzle-orm';
import { ModuleRepository } from '../../domain/repositories/module.repository';
import { Module } from '../../domain/entities/module';
import { DrizzleService } from '../config/providers/drizzle.service';
import { modules, videos } from '../database/schema';

@Injectable()
export class ModuleDrizzleRepository implements ModuleRepository {
  constructor(private readonly drizzleService: DrizzleService) {}

  async create(
    module: Omit<Module, 'id' | 'videoCount' | 'createdAt' | 'updatedAt'>,
  ): Promise<Module> {
    const [created] = await this.drizzleService.db
      .insert(modules)
      .values({
        subCourseId: module.subCourseId,
        name: module.name,
        description: module.description,
        order: module.order,
        videoCount: 0,
      })
      .returning();

    return new Module(
      created.id,
      created.subCourseId,
      created.name,
      created.description,
      created.order,
      created.videoCount,
      created.createdAt,
      created.updatedAt,
    );
  }

  async findById(id: string): Promise<Module | null> {
    const [module] = await this.drizzleService.db
      .select()
      .from(modules)
      .where(eq(modules.id, id));

    if (!module) return null;

    return new Module(
      module.id,
      module.subCourseId,
      module.name,
      module.description,
      module.order,
      module.videoCount,
      module.createdAt,
      module.updatedAt,
    );
  }

  async findBySubCourseId(subCourseId: string): Promise<Module[]> {
    const modulesList = await this.drizzleService.db
      .select()
      .from(modules)
      .where(eq(modules.subCourseId, subCourseId))
      .orderBy(modules.order);

    return modulesList.map(
      (module) =>
        new Module(
          module.id,
          module.subCourseId,
          module.name,
          module.description,
          module.order,
          module.videoCount,
          module.createdAt,
          module.updatedAt,
        ),
    );
  }

  async update(
    id: string,
    module: Partial<Omit<Module, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Module> {
    const [updated] = await this.drizzleService.db
      .update(modules)
      .set({
        subCourseId: module.subCourseId,
        name: module.name,
        description: module.description,
        order: module.order,
        videoCount: module.videoCount,
        updatedAt: new Date(),
      })
      .where(eq(modules.id, id))
      .returning();

    return new Module(
      updated.id,
      updated.subCourseId,
      updated.name,
      updated.description,
      updated.order,
      updated.videoCount,
      updated.createdAt,
      updated.updatedAt,
    );
  }

  async updateVideoCount(id: string, count: number): Promise<Module> {
    const [updated] = await this.drizzleService.db
      .update(modules)
      .set({
        videoCount: count,
        updatedAt: new Date(),
      })
      .where(eq(modules.id, id))
      .returning();

    return new Module(
      updated.id,
      updated.subCourseId,
      updated.name,
      updated.description,
      updated.order,
      updated.videoCount,
      updated.createdAt,
      updated.updatedAt,
    );
  }

  async delete(id: string): Promise<void> {
    await this.drizzleService.db.delete(modules).where(eq(modules.id, id));
  }

  async countVideosByModuleId(moduleId: string): Promise<number> {
    const [result] = await this.drizzleService.db
      .select({ count: count() })
      .from(videos)
      .where(eq(videos.moduleId, moduleId));

    return result.count;
  }
}
