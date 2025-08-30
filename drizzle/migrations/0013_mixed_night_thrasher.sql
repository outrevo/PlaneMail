CREATE TABLE IF NOT EXISTS "marketing_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"clerk_org_id" varchar(255),
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"trigger_type" varchar(50) NOT NULL,
	"trigger_config" jsonb NOT NULL,
	"settings" jsonb NOT NULL,
	"stats" jsonb DEFAULT '{"totalEntered":0,"totalCompleted":0,"totalExited":0,"currentActive":0,"conversionRate":0,"avgCompletionTime":0,"stepStats":[]}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sequence_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence_id" uuid NOT NULL,
	"subscriber_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"current_step_id" uuid,
	"current_step_started_at" timestamp,
	"next_scheduled_at" timestamp,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"exited_at" timestamp,
	"exit_reason" varchar(255),
	"metadata" jsonb DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sequence_step_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"step_id" uuid NOT NULL,
	"status" varchar(50) NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"result" jsonb,
	"error" text,
	"email_job_id" varchar(255),
	"email_message_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sequence_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"order" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"config" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "sender_address_line1" varchar(255);--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "sender_address_line2" varchar(255);--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "sender_city" varchar(100);--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "sender_state" varchar(100);--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "sender_postal_code" varchar(20);--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "sender_country" varchar(100);--> statement-breakpoint
ALTER TABLE "public_site_settings" ADD COLUMN "enable_double_opt_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "subscribers" ADD COLUMN "confirmed_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "marketing_sequences" ADD CONSTRAINT "marketing_sequences_user_id_app_users_clerk_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("clerk_user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_sequence_id_marketing_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."marketing_sequences"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_subscriber_id_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."subscribers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sequence_enrollments" ADD CONSTRAINT "sequence_enrollments_current_step_id_sequence_steps_id_fk" FOREIGN KEY ("current_step_id") REFERENCES "public"."sequence_steps"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sequence_step_executions" ADD CONSTRAINT "sequence_step_executions_enrollment_id_sequence_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."sequence_enrollments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sequence_step_executions" ADD CONSTRAINT "sequence_step_executions_step_id_sequence_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."sequence_steps"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sequence_steps" ADD CONSTRAINT "sequence_steps_sequence_id_marketing_sequences_id_fk" FOREIGN KEY ("sequence_id") REFERENCES "public"."marketing_sequences"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriber_sequence_idx" ON "sequence_enrollments" USING btree ("subscriber_id","sequence_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "next_scheduled_idx" ON "sequence_enrollments" USING btree ("next_scheduled_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sequence_step_order_idx" ON "sequence_steps" USING btree ("sequence_id","order");