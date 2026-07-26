CREATE TYPE "public"."moderation_verdict" AS ENUM('approved', 'rejected');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "moderation_decisions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"listing_id" uuid NOT NULL,
	"verdict" "moderation_verdict" NOT NULL,
	"reason" text,
	"checked_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aggregate_id" text NOT NULL,
	"topic" text NOT NULL,
	"event_key" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "processed_events" (
	"consumer_group" text NOT NULL,
	"event_id" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "processed_events_consumer_group_event_id_pk" PRIMARY KEY("consumer_group","event_id")
);
