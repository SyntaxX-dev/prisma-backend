CREATE TABLE "user_push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"token" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_push_subscriptions" ADD CONSTRAINT "user_push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_push_subscriptions_user_id_idx" ON "user_push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_push_subscriptions_endpoint_idx" ON "user_push_subscriptions" USING btree ("endpoint");