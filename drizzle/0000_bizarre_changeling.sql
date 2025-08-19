CREATE TYPE "public"."education_level" AS ENUM('ELEMENTARY', 'HIGH_SCHOOL', 'UNDERGRADUATE', 'POSTGRADUATE', 'MASTER', 'DOCTORATE');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('STUDENT');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"age" integer NOT NULL,
	"role" "user_role" DEFAULT 'STUDENT' NOT NULL,
	"education_level" "education_level" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");