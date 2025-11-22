CREATE TABLE "call_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"caller_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"status" text DEFAULT 'ringing' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"answered_at" timestamp,
	"ended_at" timestamp,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mind_map_generations_today" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mind_map_last_reset_date" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mind_map_daily_limit" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "call_rooms" ADD CONSTRAINT "call_rooms_caller_id_users_id_fk" FOREIGN KEY ("caller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_rooms" ADD CONSTRAINT "call_rooms_receiver_id_users_id_fk" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "call_rooms_caller_id_idx" ON "call_rooms" USING btree ("caller_id");--> statement-breakpoint
CREATE INDEX "call_rooms_receiver_id_idx" ON "call_rooms" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX "call_rooms_started_at_idx" ON "call_rooms" USING btree ("started_at");