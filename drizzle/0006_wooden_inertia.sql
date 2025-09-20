CREATE TABLE "video_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"sub_course_id" uuid NOT NULL,
	"is_completed" text DEFAULT 'false' NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_progress" ADD CONSTRAINT "video_progress_sub_course_id_sub_courses_id_fk" FOREIGN KEY ("sub_course_id") REFERENCES "public"."sub_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "video_progress_user_video_unique" ON "video_progress" USING btree ("user_id","video_id");--> statement-breakpoint
CREATE INDEX "video_progress_user_id_idx" ON "video_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "video_progress_video_id_idx" ON "video_progress" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "video_progress_sub_course_id_idx" ON "video_progress" USING btree ("sub_course_id");--> statement-breakpoint
CREATE INDEX "video_progress_created_at_idx" ON "video_progress" USING btree ("created_at");