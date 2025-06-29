-- Add custom domains table for white-labeling
CREATE TABLE IF NOT EXISTS "custom_domains" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar(255) NOT NULL,
  "domain" varchar(255) NOT NULL UNIQUE,
  "status" varchar(50) NOT NULL DEFAULT 'pending',
  "verification_token" varchar(100),
  "verified_at" timestamp,
  "ssl_status" varchar(50) DEFAULT 'pending',
  "ssl_issued_at" timestamp,
  "ssl_expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_user_id_app_users_clerk_user_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "app_users"("clerk_user_id") ON DELETE cascade;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS "custom_domains_user_id_idx" ON "custom_domains" ("user_id");
CREATE INDEX IF NOT EXISTS "custom_domains_domain_idx" ON "custom_domains" ("domain");
CREATE INDEX IF NOT EXISTS "custom_domains_status_idx" ON "custom_domains" ("status");
