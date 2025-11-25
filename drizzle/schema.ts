import { pgTable, index, foreignKey, uuid, text, integer, timestamp, uniqueIndex, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const collegeCourse = pgEnum("college_course", ['MEDICINA', 'ENGENHARIA', 'DIREITO', 'ADMINISTRACAO', 'CONTABILIDADE', 'PSICOLOGIA', 'PEDAGOGIA', 'ENFERMAGEM', 'FARMACIA', 'FISIOTERAPIA', 'ODONTOLOGIA', 'VETERINARIA', 'ARQUITETURA', 'CIENCIA_COMPUTACAO', 'SISTEMAS_INFORMACAO', 'JORNALISMO', 'PUBLICIDADE', 'MARKETING', 'ECONOMIA', 'RELACOES_INTERNACIONAIS', 'OUTROS'])
export const contestType = pgEnum("contest_type", ['PRF', 'ESA', 'DATAPREV', 'POLICIA_CIVIL', 'POLICIA_MILITAR', 'BOMBEIROS', 'TJ', 'MP', 'TRF', 'TRE', 'TRT', 'INSS', 'IBGE', 'ANAC', 'ANATEL', 'BACEN', 'CVM', 'SUSEP', 'PREVIC', 'OUTROS'])
export const educationLevel = pgEnum("education_level", ['ELEMENTARY', 'HIGH_SCHOOL', 'UNDERGRADUATE', 'POSTGRADUATE', 'MASTER', 'DOCTORATE'])
export const offensiveType = pgEnum("offensive_type", ['NORMAL', 'SUPER', 'ULTRA', 'KING', 'INFINITY'])
export const userFocus = pgEnum("user_focus", ['ENEM', 'CONCURSO', 'ENSINO_MEDIO', 'FACULDADE'])
export const userRole = pgEnum("user_role", ['STUDENT', 'ADMIN'])
export const quizStatus = pgEnum("quiz_status", ['IN_PROGRESS', 'COMPLETED'])


export const modules = pgTable("modules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	subCourseId: uuid("sub_course_id").notNull(),
	name: text().notNull(),
	description: text(),
	order: integer().default(0).notNull(),
	videoCount: integer("video_count").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("modules_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("modules_order_idx").using("btree", table.order.asc().nullsLast().op("int4_ops")),
	index("modules_sub_course_id_idx").using("btree", table.subCourseId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.subCourseId],
			foreignColumns: [subCourses.id],
			name: "modules_sub_course_id_sub_courses_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	age: integer(),
	role: userRole(),
	educationLevel: educationLevel("education_level"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	userFocus: userFocus("user_focus"),
	contestType: contestType("contest_type"),
	collegeCourse: collegeCourse("college_course"),
	badge: text(),
	isProfileComplete: text("is_profile_complete").default('false').notNull(),
	profileImage: text("profile_image"),
	linkedin: text(),
	github: text(),
	portfolio: text(),
	aboutYou: text("about_you"),
	habilities: text(),
	momentCareer: text("moment_career"),
	location: text(),
	instagram: text(),
	twitter: text(),
	socialLinksOrder: text("social_links_order"),
}, (table) => [
	index("users_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	uniqueIndex("users_email_unique").using("btree", table.email.asc().nullsLast().op("text_ops")),
]);

export const courses = pgTable("courses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	imageUrl: text("image_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	isPaid: text("is_paid").default('false').notNull(),
}, (table) => [
	index("courses_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	uniqueIndex("courses_name_unique").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const subCourses = pgTable("sub_courses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	courseId: uuid("course_id").notNull(),
	name: text().notNull(),
	description: text(),
	order: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("sub_courses_course_id_idx").using("btree", table.courseId.asc().nullsLast().op("uuid_ops")),
	index("sub_courses_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("sub_courses_order_idx").using("btree", table.order.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "sub_courses_course_id_courses_id_fk"
		}).onDelete("cascade"),
]);

export const videos = pgTable("videos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	subCourseId: uuid("sub_course_id").notNull(),
	videoId: text("video_id").notNull(),
	title: text().notNull(),
	description: text(),
	url: text().notNull(),
	thumbnailUrl: text("thumbnail_url"),
	duration: integer(),
	channelTitle: text("channel_title"),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	viewCount: integer("view_count"),
	tags: text().array(),
	category: text(),
	order: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	channelId: text("channel_id"),
	channelThumbnailUrl: text("channel_thumbnail_url"),
	moduleId: uuid("module_id").notNull(),
}, (table) => [
	index("videos_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("videos_module_id_idx").using("btree", table.moduleId.asc().nullsLast().op("uuid_ops")),
	index("videos_order_idx").using("btree", table.order.asc().nullsLast().op("int4_ops")),
	index("videos_sub_course_id_idx").using("btree", table.subCourseId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("videos_video_id_unique").using("btree", table.videoId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.subCourseId],
			foreignColumns: [subCourses.id],
			name: "videos_sub_course_id_sub_courses_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.moduleId],
			foreignColumns: [modules.id],
			name: "videos_module_id_modules_id_fk"
		}).onDelete("cascade"),
]);

export const offensives = pgTable("offensives", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: offensiveType().default('NORMAL').notNull(),
	consecutiveDays: integer("consecutive_days").default(0).notNull(),
	lastVideoCompletedAt: timestamp("last_video_completed_at", { mode: 'string' }).defaultNow().notNull(),
	streakStartDate: timestamp("streak_start_date", { mode: 'string' }).defaultNow().notNull(),
	totalOffensives: integer("total_offensives").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("offensives_consecutive_days_idx").using("btree", table.consecutiveDays.asc().nullsLast().op("int4_ops")),
	index("offensives_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("offensives_type_idx").using("btree", table.type.asc().nullsLast().op("enum_ops")),
	uniqueIndex("offensives_user_id_unique").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "offensives_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const videoProgress = pgTable("video_progress", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	videoId: uuid("video_id").notNull(),
	subCourseId: uuid("sub_course_id").notNull(),
	isCompleted: text("is_completed").default('false').notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("video_progress_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("video_progress_sub_course_id_idx").using("btree", table.subCourseId.asc().nullsLast().op("uuid_ops")),
	index("video_progress_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("video_progress_user_video_unique").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.videoId.asc().nullsLast().op("uuid_ops")),
	index("video_progress_video_id_idx").using("btree", table.videoId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "video_progress_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.videoId],
			foreignColumns: [videos.id],
			name: "video_progress_video_id_videos_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subCourseId],
			foreignColumns: [subCourses.id],
			name: "video_progress_sub_course_id_sub_courses_id_fk"
		}).onDelete("cascade"),
]);

export const quizSessions = pgTable("quiz_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	topic: text().notNull(),
	status: quizStatus().default('IN_PROGRESS').notNull(),
	score: integer().default(0),
	totalQuestions: integer("total_questions").default(10).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
}, (table) => [
	index("quiz_sessions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("quiz_sessions_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("quiz_sessions_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "quiz_sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const quizQuestions = pgTable("quiz_questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	questionText: text("question_text").notNull(),
	correctOption: integer("correct_option").notNull(),
	explanation: text().notNull(),
	order: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("quiz_questions_session_id_idx").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	index("quiz_questions_order_idx").using("btree", table.order.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [quizSessions.id],
			name: "quiz_questions_session_id_quiz_sessions_id_fk"
		}).onDelete("cascade"),
]);

export const quizOptions = pgTable("quiz_options", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	questionId: uuid("question_id").notNull(),
	optionText: text("option_text").notNull(),
	optionNumber: integer("option_number").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("quiz_options_question_id_idx").using("btree", table.questionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [quizQuestions.id],
			name: "quiz_options_question_id_quiz_questions_id_fk"
		}).onDelete("cascade"),
]);

export const quizAnswers = pgTable("quiz_answers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	questionId: uuid("question_id").notNull(),
	selectedOption: integer("selected_option").notNull(),
	isCorrect: text("is_correct").notNull(),
	answeredAt: timestamp("answered_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("quiz_answers_session_id_idx").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops")),
	index("quiz_answers_question_id_idx").using("btree", table.questionId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("quiz_answers_session_question_unique").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops"), table.questionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [quizSessions.id],
			name: "quiz_answers_session_id_quiz_sessions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [quizQuestions.id],
			name: "quiz_answers_question_id_quiz_questions_id_fk"
		}).onDelete("cascade"),
]);
