export class Module {
  constructor(
    public readonly id: string,
    public readonly subCourseId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly order: number,
    public readonly videoCount: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    subCourseId: string,
    name: string,
    description?: string,
    order: number = 0,
  ): Omit<Module, 'id' | 'videoCount' | 'createdAt' | 'updatedAt' | 'updateVideoCount'> {
    return {
      subCourseId,
      name,
      description: description || null,
      order,
    };
  }

  updateVideoCount(count: number): Module {
    return new Module(
      this.id,
      this.subCourseId,
      this.name,
      this.description,
      this.order,
      count,
      this.createdAt,
      this.updatedAt,
    );
  }
}
