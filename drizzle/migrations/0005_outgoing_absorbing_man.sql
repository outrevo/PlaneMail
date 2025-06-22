ALTER TABLE "newsletters" ADD COLUMN "total_opens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "newsletters" ADD COLUMN "unique_opens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "newsletters" ADD COLUMN "total_clicks" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "newsletters" ADD COLUMN "unique_clicks" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "newsletters" ADD COLUMN "total_bounces" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "newsletters" ADD COLUMN "first_opened_at" timestamp;--> statement-breakpoint
ALTER TABLE "newsletters" ADD COLUMN "last_opened_at" timestamp;