-- Create images table for storing uploaded images
CREATE TABLE IF NOT EXISTS "images" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar(255) NOT NULL,
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
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraint
ALTER TABLE "images" ADD CONSTRAINT "images_user_id_app_users_clerk_user_id_fk" 
  FOREIGN KEY ("user_id") REFERENCES "app_users"("clerk_user_id") ON DELETE cascade;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "images_user_id_idx" ON "images" ("user_id");
CREATE INDEX IF NOT EXISTS "images_created_at_idx" ON "images" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "images_folder_idx" ON "images" ("folder");
CREATE INDEX IF NOT EXISTS "images_is_deleted_idx" ON "images" ("is_deleted");

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_images_updated_at 
  BEFORE UPDATE ON "images" 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
