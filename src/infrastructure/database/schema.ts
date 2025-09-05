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

export const userRoleEnum = pgEnum('user_role', ['STUDENT']);
export const educationLevelEnum = pgEnum('education_level', [
  'ELEMENTARY',
  'HIGH_SCHOOL',
  'UNDERGRADUATE',
  'POSTGRADUATE',
  'MASTER',
  'DOCTORATE',
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
    createdAt: timestamp('created_at', { withTimezone: false })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_unique').on(table.email),
    createdAtIdx: index('users_created_at_idx').on(table.createdAt),
  }),
);
