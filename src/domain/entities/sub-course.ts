export class SubCourse {
  constructor(
    public readonly id: string,
    public readonly courseId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly order: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    courseId: string,
    name: string,
    description?: string,
    order?: number,
  ): Omit<SubCourse, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      courseId,
      name,
      description: description || null,
      order: order || 0,
    };
  }
}
