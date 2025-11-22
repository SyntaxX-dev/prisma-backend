CREATE TYPE "public"."generation_type" AS ENUM('mindmap', 'text');--> statement-breakpoint
ALTER TABLE "mind_maps" ADD COLUMN "generation_type" "generation_type" DEFAULT 'mindmap' NOT NULL;