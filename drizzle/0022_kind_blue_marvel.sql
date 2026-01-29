CREATE TYPE "public"."quiz_status" AS ENUM('IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "quiz_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"selected_option" integer NOT NULL,
	"is_correct" text NOT NULL,
	"answered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"option_text" text NOT NULL,
	"option_number" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"correct_option" integer NOT NULL,
	"explanation" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic" text NOT NULL,
	"status" "quiz_status" DEFAULT 'IN_PROGRESS' NOT NULL,
	"score" integer DEFAULT 0,
	"total_questions" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_session_id_quiz_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_options" ADD CONSTRAINT "quiz_options_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_session_id_quiz_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."quiz_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quiz_answers_session_id_idx" ON "quiz_answers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "quiz_answers_question_id_idx" ON "quiz_answers" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_answers_session_question_unique" ON "quiz_answers" USING btree ("session_id","question_id");--> statement-breakpoint
CREATE INDEX "quiz_options_question_id_idx" ON "quiz_options" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "quiz_questions_session_id_idx" ON "quiz_questions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "quiz_questions_order_idx" ON "quiz_questions" USING btree ("order");--> statement-breakpoint
CREATE INDEX "quiz_sessions_user_id_idx" ON "quiz_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quiz_sessions_status_idx" ON "quiz_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "quiz_sessions_created_at_idx" ON "quiz_sessions" USING btree ("created_at");