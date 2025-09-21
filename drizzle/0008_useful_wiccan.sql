CREATE TABLE "modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sub_course_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"video_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "module_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_sub_course_id_sub_courses_id_fk" FOREIGN KEY ("sub_course_id") REFERENCES "public"."sub_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "modules_sub_course_id_idx" ON "modules" USING btree ("sub_course_id");--> statement-breakpoint
CREATE INDEX "modules_order_idx" ON "modules" USING btree ("order");--> statement-breakpoint
CREATE INDEX "modules_created_at_idx" ON "modules" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "videos_module_id_idx" ON "videos" USING btree ("module_id");