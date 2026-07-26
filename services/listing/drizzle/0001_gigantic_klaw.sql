CREATE TABLE IF NOT EXISTS "processed_events" (
	"consumer_group" text NOT NULL,
	"event_id" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "processed_events_consumer_group_event_id_pk" PRIMARY KEY("consumer_group","event_id")
);
