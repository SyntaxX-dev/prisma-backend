import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['STUDENT', 'ADMIN']);
export const educationLevelEnum = pgEnum('education_level', [
  'ELEMENTARY',
  'HIGH_SCHOOL',
  'UNDERGRADUATE',
  'POSTGRADUATE',
  'MASTER',
  'DOCTORATE',
]);
export const userFocusEnum = pgEnum('user_focus', [
  'ENEM',
  'CONCURSO',
  'ENSINO_MEDIO',
  'FACULDADE',
]);
export const contestTypeEnum = pgEnum('contest_type', [
  'PRF',
  'ESA',
  'DATAPREV',
  'POLICIA_CIVIL',
  'POLICIA_MILITAR',
  'BOMBEIROS',
  'TJ',
  'MP',
  'TRF',
  'TRE',
  'TRT',
  'INSS',
  'IBGE',
  'ANAC',
  'ANATEL',
  'BACEN',
  'CVM',
  'SUSEP',
  'PREVIC',
  'OUTROS',
]);
export const collegeCourseEnum = pgEnum('college_course', [
  'MEDICINA',
  'ENGENHARIA',
  'DIREITO',
  'ADMINISTRACAO',
  'CONTABILIDADE',
  'PSICOLOGIA',
  'PEDAGOGIA',
  'ENFERMAGEM',
  'FARMACIA',
  'FISIOTERAPIA',
  'ODONTOLOGIA',
  'VETERINARIA',
  'ARQUITETURA',
  'CIENCIA_COMPUTACAO',
  'SISTEMAS_INFORMACAO',
  'JORNALISMO',
  'PUBLICIDADE',
  'MARKETING',
  'ECONOMIA',
  'RELACOES_INTERNACIONAIS',
  'OUTROS',
]);
export const offensiveTypeEnum = pgEnum('offensive_type', [
  'NORMAL',
  'SUPER',
  'ULTRA',
  'KING',
  'INFINITY',
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    age: integer('age'),
    role: userRoleEnum('role'),
    educationLevel: educationLevelEnum('education_level'),
    userFocus: userFocusEnum('user_focus'),
    contestType: contestTypeEnum('contest_type'),
    collegeCourse: collegeCourseEnum('college_course'),
    badge: text('badge'),
    isProfileComplete: text('is_profile_complete').notNull().default('false'),
    // Novos campos do perfil
    profileImage: text('profile_image'),
    linkedin: text('linkedin'),
    github: text('github'),
    portfolio: text('portfolio'),
    aboutYou: text('about_you'),
    habilities: text('habilities'),
    momentCareer: text('moment_career'),
    location: text('location'),
    instagram: text('instagram'),
    twitter: text('twitter'),
    socialLinksOrder: text('social_links_order'),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_unique').on(table.email),
    createdAtIdx: index('users_created_at_idx').on(table.createdAt),
  }),
);

export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    isPaid: text('is_paid').notNull().default('false'),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    nameIdx: uniqueIndex('courses_name_unique').on(table.name),
    createdAtIdx: index('courses_created_at_idx').on(table.createdAt),
  }),
);

export const subCourses = pgTable(
  'sub_courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    courseIdIdx: index('sub_courses_course_id_idx').on(table.courseId),
    orderIdx: index('sub_courses_order_idx').on(table.order),
    createdAtIdx: index('sub_courses_created_at_idx').on(table.createdAt),
  }),
);

export const modules = pgTable(
  'modules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    subCourseId: uuid('sub_course_id')
      .notNull()
      .references(() => subCourses.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    order: integer('order').notNull().default(0),
    videoCount: integer('video_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    subCourseIdIdx: index('modules_sub_course_id_idx').on(table.subCourseId),
    orderIdx: index('modules_order_idx').on(table.order),
    createdAtIdx: index('modules_created_at_idx').on(table.createdAt),
  }),
);

export const videos = pgTable(
  'videos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    moduleId: uuid('module_id')
      .notNull()
      .references(() => modules.id, { onDelete: 'cascade' }),
    subCourseId: uuid('sub_course_id')
      .notNull()
      .references(() => subCourses.id, { onDelete: 'cascade' }),
    videoId: text('video_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    url: text('url').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    duration: integer('duration'),
    channelTitle: text('channel_title'),
    channelId: text('channel_id'),
    channelThumbnailUrl: text('channel_thumbnail_url'),
    publishedAt: timestamp('published_at', { withTimezone: false }),
    viewCount: integer('view_count'),
    tags: text('tags').array(),
    category: text('category'),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    videoIdIdx: uniqueIndex('videos_video_id_unique').on(table.videoId),
    moduleIdIdx: index('videos_module_id_idx').on(table.moduleId),
    subCourseIdIdx: index('videos_sub_course_id_idx').on(table.subCourseId),
    orderIdx: index('videos_order_idx').on(table.order),
    createdAtIdx: index('videos_created_at_idx').on(table.createdAt),
  }),
);

export const videoProgress = pgTable(
  'video_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    videoId: uuid('video_id')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    subCourseId: uuid('sub_course_id')
      .notNull()
      .references(() => subCourses.id, { onDelete: 'cascade' }),
    isCompleted: text('is_completed').notNull().default('false'),
    completedAt: timestamp('completed_at', { withTimezone: false }),
    currentTimestamp: integer('current_timestamp'), // Posição atual em segundos
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userVideoIdx: uniqueIndex('video_progress_user_video_unique').on(
      table.userId,
      table.videoId,
    ),
    userIdIdx: index('video_progress_user_id_idx').on(table.userId),
    videoIdIdx: index('video_progress_video_id_idx').on(table.videoId),
    subCourseIdIdx: index('video_progress_sub_course_id_idx').on(table.subCourseId),
    createdAtIdx: index('video_progress_created_at_idx').on(table.createdAt),
  }),
);

export const offensives = pgTable(
  'offensives',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: offensiveTypeEnum('type').notNull().default('NORMAL'),
    consecutiveDays: integer('consecutive_days').notNull().default(0),
    lastVideoCompletedAt: timestamp('last_video_completed_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    streakStartDate: timestamp('streak_start_date', { withTimezone: false })
      .notNull()
      .defaultNow(),
    totalOffensives: integer('total_offensives').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: uniqueIndex('offensives_user_id_unique').on(table.userId),
    typeIdx: index('offensives_type_idx').on(table.type),
    consecutiveDaysIdx: index('offensives_consecutive_days_idx').on(table.consecutiveDays),
    createdAtIdx: index('offensives_created_at_idx').on(table.createdAt),
  }),
);
