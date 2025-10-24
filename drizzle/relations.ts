import { relations } from "drizzle-orm/relations";
import { subCourses, modules, courses, videos, users, offensives, videoProgress } from "./schema";

export const modulesRelations = relations(modules, ({one, many}) => ({
	subCourse: one(subCourses, {
		fields: [modules.subCourseId],
		references: [subCourses.id]
	}),
	videos: many(videos),
}));

export const subCoursesRelations = relations(subCourses, ({one, many}) => ({
	modules: many(modules),
	course: one(courses, {
		fields: [subCourses.courseId],
		references: [courses.id]
	}),
	videos: many(videos),
	videoProgresses: many(videoProgress),
}));

export const coursesRelations = relations(courses, ({many}) => ({
	subCourses: many(subCourses),
}));

export const videosRelations = relations(videos, ({one, many}) => ({
	subCourse: one(subCourses, {
		fields: [videos.subCourseId],
		references: [subCourses.id]
	}),
	module: one(modules, {
		fields: [videos.moduleId],
		references: [modules.id]
	}),
	videoProgresses: many(videoProgress),
}));

export const offensivesRelations = relations(offensives, ({one}) => ({
	user: one(users, {
		fields: [offensives.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	offensives: many(offensives),
	videoProgresses: many(videoProgress),
}));

export const videoProgressRelations = relations(videoProgress, ({one}) => ({
	user: one(users, {
		fields: [videoProgress.userId],
		references: [users.id]
	}),
	video: one(videos, {
		fields: [videoProgress.videoId],
		references: [videos.id]
	}),
	subCourse: one(subCourses, {
		fields: [videoProgress.subCourseId],
		references: [subCourses.id]
	}),
}));