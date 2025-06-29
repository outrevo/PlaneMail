CREATE TABLE IF NOT EXISTS "public_site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"site_name" varchar(255) DEFAULT 'PlaneMail' NOT NULL,
	"site_description" text DEFAULT 'Email marketing and newsletter platform',
	"base_url" text,
	"logo_url" text,
	"favicon" text,
	"primary_color" varchar(7) DEFAULT '#1e40af',
	"header_enabled" boolean DEFAULT true,
	"header_content" text,
	"footer_enabled" boolean DEFAULT true,
	"footer_content" text,
	"enable_newsletter_signup" boolean DEFAULT true,
	"custom_css" text,
	"custom_js" text,
	"analytics_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "public_site_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "public_site_settings" ADD CONSTRAINT "public_site_settings_user_id_app_users_clerk_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
