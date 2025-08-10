-- Add sender address fields to app_users table for email compliance
-- Required for CAN-SPAM Act and GDPR compliance

ALTER TABLE "app_users" ADD COLUMN "sender_address_line1" VARCHAR(255);
ALTER TABLE "app_users" ADD COLUMN "sender_address_line2" VARCHAR(255);
ALTER TABLE "app_users" ADD COLUMN "sender_city" VARCHAR(100);
ALTER TABLE "app_users" ADD COLUMN "sender_state" VARCHAR(100);
ALTER TABLE "app_users" ADD COLUMN "sender_postal_code" VARCHAR(20);
ALTER TABLE "app_users" ADD COLUMN "sender_country" VARCHAR(100);
