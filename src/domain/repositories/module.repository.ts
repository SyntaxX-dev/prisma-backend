import { Module } from '../entities/module';

export interface ModuleRepository {
  create(
    module: Omit<
      Module,
      'id' | 'videoCount' | 'createdAt' | 'updatedAt' | 'updateVideoCount'
    >,
  ): Promise<Module>;
  findById(id: string): Promise<Module | null>;
  findBySubCourseId(subCourseId: string): Promise<Module[]>;
  update(
    id: string,
    module: Partial<Omit<Module, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<Module>;
  updateVideoCount(id: string, count: number): Promise<Module>;
  delete(id: string): Promise<void>;
  countVideosByModuleId(moduleId: string): Promise<number>;
}
