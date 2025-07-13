CREATE TABLE IF NOT EXISTS "custom_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"clerk_org_id" varchar(255),
	"domain" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"verification_token" varchar(100),
	"verified_at" timestamp,
	"ssl_status" varchar(50) DEFAULT 'pending',
	"ssl_issued_at" timestamp,
	"ssl_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "custom_domains_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"clerk_org_id" varchar(255),
	"filename" varchar(255) NOT NULL,
	"original_url" text NOT NULL,
	"email_optimized_url" text,
	"thumbnail_url" text,
	"file_size" integer,
	"mime_type" varchar(100),
	"width" integer,
	"height" integer,
	"imagekit_file_id" varchar(255),
	"imagekit_path" text,
	"folder" varchar(255) DEFAULT 'planemail/posts',
	"tags" jsonb,
	"is_deleted" boolean DEFAULT false,
	"last_used_at" timestamp,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_org_id" varchar(255) NOT NULL,
	"plan_id" uuid NOT NULL,
	"paddle_subscription_id" text,
	"paddle_customer_id" text,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"canceled_at" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "organization_subscriptions_clerk_org_id_unique" UNIQUE("clerk_org_id"),
	CONSTRAINT "organization_subscriptions_paddle_subscription_id_unique" UNIQUE("paddle_subscription_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_org_id" varchar(255) NOT NULL,
	"current_subscribers" integer DEFAULT 0,
	"current_posts_this_month" integer DEFAULT 0,
	"current_custom_domains" integer DEFAULT 0,
	"current_team_members" integer DEFAULT 0,
	"current_integrations" integer DEFAULT 0,
	"current_api_keys" integer DEFAULT 0,
	"current_webhooks" integer DEFAULT 0,
	"current_image_uploads_this_month" integer DEFAULT 0,
	"current_emails_this_month" integer DEFAULT 0,
	"usage_period_start" timestamp DEFAULT now() NOT NULL,
	"usage_period_end" timestamp NOT NULL,
	"last_reset_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "organization_usage_clerk_org_id_unique" UNIQUE("clerk_org_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pricing_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"price" integer DEFAULT 0 NOT NULL,
	"billing_interval" varchar(20) DEFAULT 'monthly' NOT NULL,
	"max_subscribers" integer DEFAULT 1000,
	"max_posts_per_month" integer DEFAULT 10,
	"max_custom_domains" integer DEFAULT 0,
	"max_team_members" integer DEFAULT 1,
	"max_integrations" integer DEFAULT 1,
	"max_api_keys" integer DEFAULT 2,
	"max_webhooks" integer DEFAULT 2,
	"max_image_uploads" integer DEFAULT 50,
	"max_emails_per_month" integer DEFAULT 10000,
	"allow_organizations" boolean DEFAULT false,
	"allow_advanced_analytics" boolean DEFAULT false,
	"allow_custom_domains" boolean DEFAULT false,
	"allow_api_access" boolean DEFAULT false,
	"features" jsonb,
	"paddle_product_id" text,
	"paddle_price_id" text,
	"is_active" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pricing_plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "clerk_org_id" varchar(255);--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "clerk_org_id" varchar(255);--> statement-breakpoint
ALTER TABLE "segments" ADD COLUMN "clerk_org_id" varchar(255);--> statement-breakpoint
ALTER TABLE "subscribers" ADD COLUMN "clerk_org_id" varchar(255);--> statement-breakpoint
ALTER TABLE "user_integrations" ADD COLUMN "clerk_org_id" varchar(255);--> statement-breakpoint
ALTER TABLE "webhooks" ADD COLUMN "clerk_org_id" varchar(255);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_user_id_app_users_clerk_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "images" ADD CONSTRAINT "images_user_id_app_users_clerk_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_subscriptions" ADD CONSTRAINT "organization_subscriptions_plan_id_pricing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."pricing_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
