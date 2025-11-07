CREATE TYPE "public"."community_visibility" AS ENUM('PUBLIC', 'PRIVATE');--> statement-breakpoint
CREATE TABLE "communities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"focus" text NOT NULL,
	"description" text,
	"image" text,
	"visibility" "community_visibility" DEFAULT 'PUBLIC' NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"inviter_id" uuid NOT NULL,
	"invitee_username" text NOT NULL,
	"invitee_id" uuid,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "video_progress" ADD COLUMN "current_timestamp" integer;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_invites" ADD CONSTRAINT "community_invites_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_invites" ADD CONSTRAINT "community_invites_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_invites" ADD CONSTRAINT "community_invites_invitee_id_users_id_fk" FOREIGN KEY ("invitee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "communities_name_unique" ON "communities" USING btree ("name");--> statement-breakpoint
CREATE INDEX "communities_owner_id_idx" ON "communities" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "communities_visibility_idx" ON "communities" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "communities_focus_idx" ON "communities" USING btree ("focus");--> statement-breakpoint
CREATE INDEX "communities_created_at_idx" ON "communities" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "community_invites_community_invitee_unique" ON "community_invites" USING btree ("community_id","invitee_username");--> statement-breakpoint
CREATE INDEX "community_invites_community_id_idx" ON "community_invites" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "community_invites_invitee_username_idx" ON "community_invites" USING btree ("invitee_username");--> statement-breakpoint
CREATE INDEX "community_invites_invitee_id_idx" ON "community_invites" USING btree ("invitee_id");--> statement-breakpoint
CREATE INDEX "community_invites_status_idx" ON "community_invites" USING btree ("status");--> statement-breakpoint
CREATE INDEX "community_invites_created_at_idx" ON "community_invites" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "community_members_community_user_unique" ON "community_members" USING btree ("community_id","user_id");--> statement-breakpoint
CREATE INDEX "community_members_community_id_idx" ON "community_members" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "community_members_user_id_idx" ON "community_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "community_members_joined_at_idx" ON "community_members" USING btree ("joined_at");