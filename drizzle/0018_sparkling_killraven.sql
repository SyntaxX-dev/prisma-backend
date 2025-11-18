CREATE TABLE "mind_maps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"content" text NOT NULL,
	"video_title" text NOT NULL,
	"video_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mind_maps" ADD CONSTRAINT "mind_maps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mind_maps" ADD CONSTRAINT "mind_maps_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mind_maps_user_id_idx" ON "mind_maps" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mind_maps_user_video_idx" ON "mind_maps" USING btree ("user_id","video_id");--> statement-breakpoint
CREATE INDEX "mind_maps_created_at_idx" ON "mind_maps" USING btree ("created_at");