CREATE TABLE "community_message_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"cloudinary_public_id" text NOT NULL,
	"thumbnail_url" text,
	"width" integer,
	"height" integer,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"updated_at" timestamp,
	"is_deleted" text DEFAULT 'false' NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"cloudinary_public_id" text NOT NULL,
	"thumbnail_url" text,
	"width" integer,
	"height" integer,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pinned_community_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"community_id" uuid NOT NULL,
	"pinned_by" uuid NOT NULL,
	"pinned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pinned_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"pinned_by" uuid NOT NULL,
	"user_id_1" uuid NOT NULL,
	"user_id_2" uuid NOT NULL,
	"pinned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "is_deleted" text DEFAULT 'false' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "community_message_attachments" ADD CONSTRAINT "community_message_attachments_message_id_community_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."community_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_messages" ADD CONSTRAINT "community_messages_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_messages" ADD CONSTRAINT "community_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinned_community_messages" ADD CONSTRAINT "pinned_community_messages_message_id_community_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."community_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinned_community_messages" ADD CONSTRAINT "pinned_community_messages_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinned_community_messages" ADD CONSTRAINT "pinned_community_messages_pinned_by_users_id_fk" FOREIGN KEY ("pinned_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinned_messages" ADD CONSTRAINT "pinned_messages_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinned_messages" ADD CONSTRAINT "pinned_messages_pinned_by_users_id_fk" FOREIGN KEY ("pinned_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinned_messages" ADD CONSTRAINT "pinned_messages_user_id_1_users_id_fk" FOREIGN KEY ("user_id_1") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinned_messages" ADD CONSTRAINT "pinned_messages_user_id_2_users_id_fk" FOREIGN KEY ("user_id_2") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_message_attachments_message_id_idx" ON "community_message_attachments" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "community_message_attachments_created_at_idx" ON "community_message_attachments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "community_messages_community_id_idx" ON "community_messages" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "community_messages_created_at_idx" ON "community_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "community_messages_sender_id_idx" ON "community_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "community_messages_community_created_idx" ON "community_messages" USING btree ("community_id","created_at");--> statement-breakpoint
CREATE INDEX "message_attachments_message_id_idx" ON "message_attachments" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "message_attachments_created_at_idx" ON "message_attachments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pinned_community_messages_community_id_idx" ON "pinned_community_messages" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "pinned_community_messages_message_id_idx" ON "pinned_community_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "pinned_community_messages_pinned_at_idx" ON "pinned_community_messages" USING btree ("pinned_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pinned_community_messages_message_id_unique" ON "pinned_community_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "pinned_messages_conversation_idx" ON "pinned_messages" USING btree ("user_id_1","user_id_2");--> statement-breakpoint
CREATE INDEX "pinned_messages_message_id_idx" ON "pinned_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "pinned_messages_pinned_at_idx" ON "pinned_messages" USING btree ("pinned_at");--> statement-breakpoint
CREATE UNIQUE INDEX "pinned_messages_message_id_unique" ON "pinned_messages" USING btree ("message_id");