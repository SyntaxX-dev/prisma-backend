ALTER TABLE "users" ADD COLUMN "text_generations_today" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "text_last_reset_date" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "text_daily_limit" integer DEFAULT 5 NOT NULL;