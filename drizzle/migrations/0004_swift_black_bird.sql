ALTER TABLE "newsletters" ADD COLUMN "sending_provider_id" varchar(50);--> statement-breakpoint
ALTER TABLE "newsletters" ADD COLUMN "provider_message_id" text;