-- Migration for Organizations and Team Billing
-- Add organization tables and update subscription system

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_org_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  billing_email VARCHAR(255),
  plan_type VARCHAR(50) DEFAULT 'personal' NOT NULL, -- personal, hosted, pro, enterprise
  subscription_status VARCHAR(50) DEFAULT 'active' NOT NULL,
  subscriber_limit INTEGER DEFAULT 1000, -- Based on plan
  posts_limit INTEGER DEFAULT 10, -- Monthly posts limit
  email_sends_limit INTEGER DEFAULT 5000, -- Monthly email sends
  custom_domain_enabled BOOLEAN DEFAULT false,
  analytics_enabled BOOLEAN DEFAULT true,
  api_access_enabled BOOLEAN DEFAULT false,
  team_collaboration_enabled BOOLEAN DEFAULT false,
  white_label_enabled BOOLEAN DEFAULT false,
  priority_support_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Organization members table
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  clerk_user_id VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member' NOT NULL, -- owner, admin, member
  joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Organization subscriptions table
CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  paddle_subscription_id TEXT UNIQUE,
  paddle_plan_id TEXT,
  status VARCHAR(50) NOT NULL, -- active, trialing, past_due, canceled, unpaid
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  trial_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS organization_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL, -- YYYY-MM format
  subscribers_count INTEGER DEFAULT 0,
  posts_sent INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  storage_used BIGINT DEFAULT 0, -- in bytes
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, month_year)
);

-- Update app_users to support organizations
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS current_organization_id UUID REFERENCES organizations(id);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS personal_organization_id UUID REFERENCES organizations(id);

-- Update posts table to link to organizations
ALTER TABLE posts ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Update subscribers table to link to organizations  
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Update user_integrations to link to organizations
ALTER TABLE user_integrations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Update api_keys to link to organizations
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Update webhooks to link to organizations
ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Update public_site_settings to link to organizations
ALTER TABLE public_site_settings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_clerk_org_id ON organizations(clerk_org_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_organization_usage_org_month ON organization_usage(organization_id, month_year);
CREATE INDEX IF NOT EXISTS idx_posts_organization_id ON posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_organization_id ON subscribers(organization_id);
