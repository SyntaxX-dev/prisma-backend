CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sub_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sub_course_id" uuid NOT NULL,
	"video_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"duration" integer,
	"channel_title" text,
	"published_at" timestamp,
	"view_count" integer,
	"tags" text[],
	"category" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "age" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "education_level" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sub_courses" ADD CONSTRAINT "sub_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_sub_course_id_sub_courses_id_fk" FOREIGN KEY ("sub_course_id") REFERENCES "public"."sub_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "courses_name_unique" ON "courses" USING btree ("name");--> statement-breakpoint
CREATE INDEX "courses_created_at_idx" ON "courses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sub_courses_course_id_idx" ON "sub_courses" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "sub_courses_order_idx" ON "sub_courses" USING btree ("order");--> statement-breakpoint
CREATE INDEX "sub_courses_created_at_idx" ON "sub_courses" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "videos_video_id_unique" ON "videos" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "videos_sub_course_id_idx" ON "videos" USING btree ("sub_course_id");--> statement-breakpoint
CREATE INDEX "videos_order_idx" ON "videos" USING btree ("order");--> statement-breakpoint
CREATE INDEX "videos_created_at_idx" ON "videos" USING btree ("created_at");