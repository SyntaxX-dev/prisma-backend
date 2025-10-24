CREATE TYPE "public"."offensive_type" AS ENUM('NORMAL', 'SUPER', 'ULTRA', 'KING', 'INFINITY');--> statement-breakpoint
CREATE TABLE "offensives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "offensive_type" DEFAULT 'NORMAL' NOT NULL,
	"consecutive_days" integer DEFAULT 0 NOT NULL,
	"last_video_completed_at" timestamp DEFAULT now() NOT NULL,
	"streak_start_date" timestamp DEFAULT now() NOT NULL,
	"total_offensives" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "offensives" ADD CONSTRAINT "offensives_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "offensives_user_id_unique" ON "offensives" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "offensives_type_idx" ON "offensives" USING btree ("type");--> statement-breakpoint
CREATE INDEX "offensives_consecutive_days_idx" ON "offensives" USING btree ("consecutive_days");--> statement-breakpoint
CREATE INDEX "offensives_created_at_idx" ON "offensives" USING btree ("created_at");