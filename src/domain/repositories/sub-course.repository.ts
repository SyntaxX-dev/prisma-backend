import { SubCourse } from '../entities/sub-course';

export interface SubCourseRepository {
  create(
    subCourse: Omit<SubCourse, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<SubCourse>;
  findById(id: string): Promise<SubCourse | null>;
  findByCourseId(courseId: string): Promise<SubCourse[]>;
  findByPlaylistId(
    courseId: string,
    playlistId: string,
  ): Promise<SubCourse | null>;
  findByCourseIdWithChannelInfo(
    courseId: string,
    limit?: number,
    offset?: number,
  ): Promise<SubCourse[]>;
  findAll(): Promise<SubCourse[]>;
  update(
    id: string,
    subCourse: Partial<Omit<SubCourse, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<SubCourse>;
  delete(id: string): Promise<void>;
  findByName(name: string): Promise<SubCourse | null>;
}
