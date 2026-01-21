CREATE TYPE "public"."effective_date_period" AS ENUM('ON_PAYMENT_CONFIRMATION', 'ON_PAYMENT_DUE_DATE', 'BEFORE_PAYMENT_DUE_DATE', 'ON_NEXT_MONTH');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('SCHEDULED', 'AUTHORIZED', 'PROCESSING_CANCELLATION', 'CANCELLED', 'CANCELLATION_DENIED', 'ERROR');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('PIX', 'CREDIT_CARD', 'BOLETO');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('START', 'PRO', 'ULTRA');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('PENDING', 'ACTIVE', 'OVERDUE', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "auto_invoice_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"asaas_config_id" text NOT NULL,
	"municipal_service_code" text,
	"municipal_service_name" text,
	"effective_date_period" "effective_date_period" DEFAULT 'ON_PAYMENT_CONFIRMATION' NOT NULL,
	"observations" text,
	"is_active" text DEFAULT 'true' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fiscal_info" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"municipal_inscription" text NOT NULL,
	"simples_nacional" text DEFAULT 'true' NOT NULL,
	"rps_serie" text NOT NULL,
	"rps_number" integer NOT NULL,
	"special_tax_regime" text,
	"service_list_item" text,
	"cnae" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asaas_invoice_id" text NOT NULL,
	"subscription_id" uuid,
	"payment_id" text,
	"status" "invoice_status" DEFAULT 'SCHEDULED' NOT NULL,
	"customer_name" text NOT NULL,
	"value" integer NOT NULL,
	"service_description" text NOT NULL,
	"effective_date" timestamp NOT NULL,
	"pdf_url" text,
	"xml_url" text,
	"number" text,
	"validation_code" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"asaas_payment_id" text NOT NULL,
	"amount" integer NOT NULL,
	"net_amount" integer,
	"payment_method" "payment_method",
	"status" text NOT NULL,
	"paid_at" timestamp,
	"due_date" timestamp,
	"invoice_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"token" text NOT NULL,
	"email" text NOT NULL,
	"is_used" text DEFAULT 'false' NOT NULL,
	"used_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"asaas_customer_id" text NOT NULL,
	"asaas_subscription_id" text,
	"plan" "subscription_plan" NOT NULL,
	"status" "subscription_status" DEFAULT 'PENDING' NOT NULL,
	"payment_method" "payment_method",
	"current_price" integer NOT NULL,
	"pending_plan_change" "subscription_plan",
	"start_date" timestamp,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancelled_at" timestamp,
	"customer_email" text NOT NULL,
	"customer_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "is_producer_course" text DEFAULT 'false' NOT NULL;--> statement-breakpoint
ALTER TABLE "auto_invoice_config" ADD CONSTRAINT "auto_invoice_config_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_history" ADD CONSTRAINT "invoice_history_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_tokens" ADD CONSTRAINT "registration_tokens_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auto_invoice_config_subscription_id_unique" ON "auto_invoice_config" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "auto_invoice_config_asaas_config_id_idx" ON "auto_invoice_config" USING btree ("asaas_config_id");--> statement-breakpoint
CREATE INDEX "auto_invoice_config_is_active_idx" ON "auto_invoice_config" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "auto_invoice_config_created_at_idx" ON "auto_invoice_config" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_history_asaas_invoice_id_unique" ON "invoice_history" USING btree ("asaas_invoice_id");--> statement-breakpoint
CREATE INDEX "invoice_history_subscription_id_idx" ON "invoice_history" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "invoice_history_payment_id_idx" ON "invoice_history" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "invoice_history_status_idx" ON "invoice_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoice_history_effective_date_idx" ON "invoice_history" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "invoice_history_created_at_idx" ON "invoice_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payment_history_subscription_id_idx" ON "payment_history" USING btree ("subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_history_asaas_payment_id_unique" ON "payment_history" USING btree ("asaas_payment_id");--> statement-breakpoint
CREATE INDEX "payment_history_status_idx" ON "payment_history" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_history_paid_at_idx" ON "payment_history" USING btree ("paid_at");--> statement-breakpoint
CREATE INDEX "payment_history_created_at_idx" ON "payment_history" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "registration_tokens_token_unique" ON "registration_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "registration_tokens_subscription_id_idx" ON "registration_tokens" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "registration_tokens_email_idx" ON "registration_tokens" USING btree ("email");--> statement-breakpoint
CREATE INDEX "registration_tokens_expires_at_idx" ON "registration_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_asaas_customer_id_idx" ON "subscriptions" USING btree ("asaas_customer_id");--> statement-breakpoint
CREATE INDEX "subscriptions_asaas_subscription_id_idx" ON "subscriptions" USING btree ("asaas_subscription_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_customer_email_idx" ON "subscriptions" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "subscriptions_created_at_idx" ON "subscriptions" USING btree ("created_at");