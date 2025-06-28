CREATE TABLE IF NOT EXISTS "post_segments" (
	"post_id" uuid NOT NULL,
	"segment_id" uuid NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "post_segments_post_id_segment_id_pk" PRIMARY KEY("post_id","segment_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text,
	"excerpt" text,
	"slug" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"email_subject" varchar(255),
	"from_name" varchar(255),
	"from_email" varchar(255),
	"sent_at" timestamp,
	"recipient_count" integer DEFAULT 0,
	"sending_provider_id" varchar(50),
	"provider_message_id" text,
	"web_enabled" boolean DEFAULT false,
	"web_published_at" timestamp,
	"seo_title" varchar(255),
	"seo_description" text,
	"total_opens" integer DEFAULT 0 NOT NULL,
	"unique_opens" integer DEFAULT 0 NOT NULL,
	"total_clicks" integer DEFAULT 0 NOT NULL,
	"unique_clicks" integer DEFAULT 0 NOT NULL,
	"total_bounces" integer DEFAULT 0 NOT NULL,
	"web_views" integer DEFAULT 0 NOT NULL,
	"first_opened_at" timestamp,
	"last_opened_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_segments" ADD CONSTRAINT "post_segments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_segments" ADD CONSTRAINT "post_segments_segment_id_segments_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."segments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_slug_idx" ON "posts" USING btree ("user_id","slug");