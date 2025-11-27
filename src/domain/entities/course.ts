export class Course {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly imageUrl: string | null,
    public readonly isPaid: boolean,
    public readonly isProducerCourse: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    name: string,
    description?: string,
    imageUrl?: string,
    isPaid: boolean = false,
    isProducerCourse: boolean = false,
  ): Omit<Course, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name,
      description: description || null,
      imageUrl: imageUrl || null,
      isPaid,
      isProducerCourse,
    };
  }
}
