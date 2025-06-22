CREATE TABLE IF NOT EXISTS "waitlist_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "user_integrations" ADD COLUMN "secret_api_key" text;