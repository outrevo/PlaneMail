import { pgTable, text, varchar, timestamp, uuid, primaryKey, uniqueIndex, boolean, integer, jsonb, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const UserRole = pgTable('user_role', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(), 
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const appUsers = pgTable('app_users', {
  clerkUserId: varchar('clerk_user_id', { length: 255 }).primaryKey(), 
  roleId: uuid('role_id').references(() => UserRole.id),
  
  // Compliance: Sender address for email compliance (CAN-SPAM, GDPR)
  senderAddressLine1: varchar('sender_address_line1', { length: 255 }),
  senderAddressLine2: varchar('sender_address_line2', { length: 255 }),
  senderCity: varchar('sender_city', { length: 100 }),
  senderState: varchar('sender_state', { length: 100 }),
  senderPostalCode: varchar('sender_postal_code', { length: 20 }),
  senderCountry: varchar('sender_country', { length: 100 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const userIntegrations = pgTable('user_integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => appUsers.clerkUserId, { onDelete: 'cascade' }),
  clerkOrgId: varchar('clerk_org_id', { length: 255 }), // Clerk organization ID for team integrations
  provider: varchar('provider', { length: 50 }).notNull(), 
  apiKey: text('api_key'), // For Brevo, Mailgun API Key, AWS Access Key ID
  secretApiKey: text('secret_api_key'), // For AWS Secret Access Key
  status: varchar('status', { length: 50 }).default('inactive').notNull(), 
  meta: jsonb('meta'), 
  connectedAt: timestamp('connected_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => {
  return {
    userProviderUnique: uniqueIndex('user_provider_idx').on(table.userId, table.provider),
  };
});

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => appUsers.clerkUserId, { onDelete: 'cascade' }),
  clerkOrgId: varchar('clerk_org_id', { length: 255 }), // Clerk organization ID for team API keys
  name: varchar('name', { length: 100 }).notNull(),
  prefix: varchar('prefix', { length: 12 }).notNull().unique(), 
  hashedKey: text('hashed_key').notNull(), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
});

export const webhooks = pgTable('webhooks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => appUsers.clerkUserId, { onDelete: 'cascade' }),
  clerkOrgId: varchar('clerk_org_id', { length: 255 }), // Clerk organization ID for team webhooks
  url: text('url').notNull(),
  events: jsonb('events').notNull(), // Array of event types
  description: varchar('description', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastTriggeredAt: timestamp('last_triggered_at'),
}, (table) => {
  return {
    userUrlUnique: uniqueIndex('webhook_user_url_idx').on(table.userId, table.url),
  };
});

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  clerkOrgId: varchar('clerk_org_id', { length: 255 }), // Clerk organization ID for team posts
  
  // Basic post information
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'), // Rich content/HTML
  excerpt: text('excerpt'), // Short description for previews
  slug: varchar('slug', { length: 255 }).notNull(), // URL-friendly identifier for web publishing
  
  // Publication settings
  status: varchar('status', { length: 50 }).default('draft').notNull(), // draft, published, scheduled, sent
  publishedAt: timestamp('published_at'),
  
  // Email publishing settings
  emailSubject: varchar('email_subject', { length: 255 }), // Subject line when sent as email
  fromName: varchar('from_name', { length: 255 }),
  fromEmail: varchar('from_email', { length: 255 }),
  sentAt: timestamp('sent_at'),
  recipientCount: integer('recipient_count').default(0),
  sendingProviderId: varchar('sending_provider_id', { length: 50 }),
  providerMessageId: text('provider_message_id'),
  
  // Web publishing settings  
  webEnabled: boolean('web_enabled').default(false), // Whether to publish as web page
  webPublishedAt: timestamp('web_published_at'),
  seoTitle: varchar('seo_title', { length: 255 }), // SEO title for web page
  seoDescription: text('seo_description'), // SEO description for web page
  
  // Analytics
  totalOpens: integer('total_opens').default(0).notNull(),
  uniqueOpens: integer('unique_opens').default(0).notNull(),
  totalClicks: integer('total_clicks').default(0).notNull(),
  uniqueClicks: integer('unique_clicks').default(0).notNull(),
  totalBounces: integer('total_bounces').default(0).notNull(),
  webViews: integer('web_views').default(0).notNull(),
  firstOpenedAt: timestamp('first_opened_at'),
  lastOpenedAt: timestamp('last_opened_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => {
  return {
    userSlugUnique: uniqueIndex('user_slug_idx').on(table.userId, table.slug),
  };
});

export const subscribers = pgTable('subscribers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(), 
  clerkOrgId: varchar('clerk_org_id', { length: 255 }), // Clerk organization ID for team subscribers
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  status: varchar('status', { length: 50 }).default('active').notNull(), 
  dateAdded: timestamp('date_added').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
  // Double opt-in: timestamp when subscriber confirmed
  confirmedAt: timestamp('confirmed_at'),
}, (table) => {
  return {
    userEmailUnique: uniqueIndex('user_email_idx').on(table.userId, table.email),
  };
});

export const segments = pgTable('segments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(), 
  clerkOrgId: varchar('clerk_org_id', { length: 255 }), // Clerk organization ID for team segments
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const subscriberSegments = pgTable('subscriber_segments', {
  subscriberId: uuid('subscriber_id').notNull().references(() => subscribers.id, { onDelete: 'cascade' }),
  segmentId: uuid('segment_id').notNull().references(() => segments.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.subscriberId, table.segmentId] }),
  };
});

// Post-Segment relationship for audience targeting
export const postSegments = pgTable('post_segments', {
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  segmentId: uuid('segment_id').notNull().references(() => segments.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.postId, table.segmentId] }),
  };
});

export const userSubscriptions = pgTable('user_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => appUsers.clerkUserId, { onDelete: 'cascade' }).unique(), 
  paddleSubscriptionId: text('paddle_subscription_id').unique(), 
  paddlePlanId: text('paddle_plan_id'), 
  status: varchar('status', { length: 50 }).notNull(), 
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const waitlistUsers = pgTable('waitlist_users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const publicSiteSettings = pgTable('public_site_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => appUsers.clerkUserId, { onDelete: 'cascade' }).unique(),
  
  // Basic site info
  siteName: varchar('site_name', { length: 255 }).notNull().default('PlaneMail'),
  siteDescription: text('site_description').default('Email marketing and newsletter platform'),
  baseUrl: text('base_url'),
  logoUrl: text('logo_url'),
  favicon: text('favicon'),
  primaryColor: varchar('primary_color', { length: 7 }).default('#1e40af'),
  
  // Header/Footer settings
  headerEnabled: boolean('header_enabled').default(true),
  headerContent: text('header_content'), // Custom HTML for header
  footerEnabled: boolean('footer_enabled').default(true),
  footerContent: text('footer_content'), // Custom HTML for footer
  
  // Features
  enableNewsletterSignup: boolean('enable_newsletter_signup').default(true),
  // Allow user to decide if double opt-in is required
  enableDoubleOptIn: boolean('enable_double_opt_in').default(false).notNull(),
  
  // Custom code
  customCss: text('custom_css'),
  customJs: text('custom_js'),
  analyticsCode: text('analytics_code'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const customDomains = pgTable('custom_domains', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => appUsers.clerkUserId, { onDelete: 'cascade' }),
  clerkOrgId: varchar('clerk_org_id', { length: 255 }), // Clerk organization ID for team domains
  domain: varchar('domain', { length: 255 }).notNull().unique(),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, verified, active, failed
  verificationToken: varchar('verification_token', { length: 100 }),
  verifiedAt: timestamp('verified_at'),
  sslStatus: varchar('ssl_status', { length: 50 }).default('pending'), // pending, issued, renewed, failed
  sslIssuedAt: timestamp('ssl_issued_at'),
  sslExpiresAt: timestamp('ssl_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Images table for storing uploaded images
export const images = pgTable('images', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => appUsers.clerkUserId, { onDelete: 'cascade' }),
  clerkOrgId: varchar('clerk_org_id', { length: 255 }), // Clerk organization ID for team images
  
  // File information
  filename: varchar('filename', { length: 255 }).notNull(),
  originalUrl: text('original_url').notNull(), // Original ImageKit or uploaded URL
  emailOptimizedUrl: text('email_optimized_url'), // Email-optimized version
  thumbnailUrl: text('thumbnail_url'), // Thumbnail version
  
  // Metadata
  fileSize: integer('file_size'), // Size in bytes
  mimeType: varchar('mime_type', { length: 100 }),
  width: integer('width'),
  height: integer('height'),
  
  // ImageKit specific
  imagekitFileId: varchar('imagekit_file_id', { length: 255 }), // ImageKit file ID for management
  imagekitPath: text('imagekit_path'), // Path in ImageKit
  
  // Organization
  folder: varchar('folder', { length: 255 }).default('planemail/posts'), // Folder/category
  tags: jsonb('tags'), // Array of tags for organization
  
  // Usage tracking
  isDeleted: boolean('is_deleted').default(false),
  lastUsedAt: timestamp('last_used_at'),
  usageCount: integer('usage_count').default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Pricing plans for team billing
export const pricingPlans = pgTable('pricing_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  price: integer('price').notNull().default(0), // Price in cents
  billingInterval: varchar('billing_interval', { length: 20 }).notNull().default('monthly'), // monthly, yearly
  
  // Limits
  maxSubscribers: integer('max_subscribers').default(1000),
  maxPostsPerMonth: integer('max_posts_per_month').default(10),
  maxCustomDomains: integer('max_custom_domains').default(0),
  maxTeamMembers: integer('max_team_members').default(1), // 1 = personal only, >1 = team allowed
  maxIntegrations: integer('max_integrations').default(1),
  maxApiKeys: integer('max_api_keys').default(2),
  maxWebhooks: integer('max_webhooks').default(2),
  maxImageUploads: integer('max_image_uploads').default(50), // per month
  maxEmailsPerMonth: integer('max_emails_per_month').default(10000),
  
  // Organization/Team features (only on paid plans)
  allowOrganizations: boolean('allow_organizations').default(false),
  allowAdvancedAnalytics: boolean('allow_advanced_analytics').default(false),
  allowCustomDomains: boolean('allow_custom_domains').default(false),
  allowApiAccess: boolean('allow_api_access').default(false),
  
  // Features
  features: jsonb('features'), // Array of feature flags
  
  // Paddle integration
  paddleProductId: text('paddle_product_id'),
  paddlePriceId: text('paddle_price_id'),
  
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false), // Default plan for new personal accounts
  sortOrder: integer('sort_order').default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Organization subscriptions (works with Clerk organizations)
export const organizationSubscriptions = pgTable('organization_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkOrgId: varchar('clerk_org_id', { length: 255 }).notNull().unique(), // Clerk organization ID
  planId: uuid('plan_id').notNull().references(() => pricingPlans.id),
  
  // Paddle integration
  paddleSubscriptionId: text('paddle_subscription_id').unique(),
  paddleCustomerId: text('paddle_customer_id'),
  
  status: varchar('status', { length: 50 }).notNull().default('active'), // active, canceled, past_due, trialing
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  canceledAt: timestamp('canceled_at'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Organization usage tracking
export const organizationUsage = pgTable('organization_usage', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkOrgId: varchar('clerk_org_id', { length: 255 }).notNull().unique(), // Clerk organization ID
  
  // Current usage counters
  currentSubscribers: integer('current_subscribers').default(0),
  currentPostsThisMonth: integer('current_posts_this_month').default(0),
  currentCustomDomains: integer('current_custom_domains').default(0),
  currentTeamMembers: integer('current_team_members').default(0),
  currentIntegrations: integer('current_integrations').default(0),
  currentApiKeys: integer('current_api_keys').default(0),
  currentWebhooks: integer('current_webhooks').default(0),
  currentImageUploadsThisMonth: integer('current_image_uploads_this_month').default(0),
  currentEmailsThisMonth: integer('current_emails_this_month').default(0),
  
  // Usage period (monthly reset)
  usagePeriodStart: timestamp('usage_period_start').defaultNow().notNull(),
  usagePeriodEnd: timestamp('usage_period_end').notNull(),
  
  // Tracking
  lastResetAt: timestamp('last_reset_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Marketing Automation Sequences
export const marketingSequences = pgTable('marketing_sequences', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => appUsers.clerkUserId, { onDelete: 'cascade' }),
  clerkOrgId: varchar('clerk_org_id', { length: 255 }),
  
  // Basic sequence information
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 50 }).default('draft').notNull(), // draft, active, paused, completed
  
  // Trigger configuration
  triggerType: varchar('trigger_type', { length: 50 }).notNull(), // subscription, tag_added, tag_removed, manual, webhook, date_based
  triggerConfig: jsonb('trigger_config').notNull(), // SequenceTriggerConfig
  
  // Sequence settings
  settings: jsonb('settings').notNull(), // SequenceSettings
  
  // Statistics (updated periodically)
  stats: jsonb('stats').default('{"totalEntered":0,"totalCompleted":0,"totalExited":0,"currentActive":0,"conversionRate":0,"avgCompletionTime":0,"stepStats":[]}').notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const sequenceSteps = pgTable('sequence_steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  sequenceId: uuid('sequence_id').notNull().references(() => marketingSequences.id, { onDelete: 'cascade' }),
  
  // Step configuration
  type: varchar('type', { length: 50 }).notNull(), // email, wait, condition, action
  order: integer('order').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  config: jsonb('config').notNull(), // SequenceStepConfig
  isActive: boolean('is_active').default(true).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => {
  return {
    sequenceOrderIdx: uniqueIndex('sequence_step_order_idx').on(table.sequenceId, table.order),
  };
});

export const sequenceEnrollments = pgTable('sequence_enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  sequenceId: uuid('sequence_id').notNull().references(() => marketingSequences.id, { onDelete: 'cascade' }),
  subscriberId: uuid('subscriber_id').notNull().references(() => subscribers.id, { onDelete: 'cascade' }),
  
  // Enrollment status
  status: varchar('status', { length: 50 }).default('active').notNull(), // active, completed, exited, paused
  currentStepId: uuid('current_step_id').references(() => sequenceSteps.id),
  currentStepStartedAt: timestamp('current_step_started_at'),
  nextScheduledAt: timestamp('next_scheduled_at'),
  
  // Tracking
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  exitedAt: timestamp('exited_at'),
  exitReason: varchar('exit_reason', { length: 255 }),
  
  // Custom data for this enrollment
  metadata: jsonb('metadata').default('{}'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => {
  return {
    subscriberSequenceIdx: uniqueIndex('subscriber_sequence_idx').on(table.subscriberId, table.sequenceId),
    nextScheduledIdx: uniqueIndex('next_scheduled_idx').on(table.nextScheduledAt),
  };
});

export const sequenceStepExecutions = pgTable('sequence_step_executions', {
  id: uuid('id').defaultRandom().primaryKey(),
  enrollmentId: uuid('enrollment_id').notNull().references(() => sequenceEnrollments.id, { onDelete: 'cascade' }),
  stepId: uuid('step_id').notNull().references(() => sequenceSteps.id, { onDelete: 'cascade' }),
  
  // Execution details
  status: varchar('status', { length: 50 }).notNull(), // pending, executing, completed, failed, skipped
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  
  // Results
  result: jsonb('result'), // Execution result data (email IDs, action results, etc.)
  error: text('error'), // Error message if failed
  
  // Email-specific tracking
  emailJobId: varchar('email_job_id', { length: 255 }), // BullMQ job ID
  emailMessageId: text('email_message_id'), // Provider message ID
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

// Relations
export const appUsersRelations = relations(appUsers, ({ one, many }) => ({
  role: one(UserRole, {
    fields: [appUsers.roleId],
    references: [UserRole.id],
  }),
  integrations: many(userIntegrations),
  apiKeys: many(apiKeys), 
  webhooks: many(webhooks),
  subscription: one(userSubscriptions, { 
    fields: [appUsers.clerkUserId],
    references: [userSubscriptions.userId],
  }),
  posts: many(posts),
  images: many(images),
  siteSettings: one(publicSiteSettings, {
    fields: [appUsers.clerkUserId],
    references: [publicSiteSettings.userId],
  }),
  customDomain: one(customDomains, {
    fields: [appUsers.clerkUserId],
    references: [customDomains.userId],
  }),
}));

export const userIntegrationsRelations = relations(userIntegrations, ({ one }) => ({
  user: one(appUsers, {
    fields: [userIntegrations.userId],
    references: [appUsers.clerkUserId],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(appUsers, {
    fields: [apiKeys.userId],
    references: [appUsers.clerkUserId],
  }),
}));

export const webhooksRelations = relations(webhooks, ({ one }) => ({
  user: one(appUsers, {
    fields: [webhooks.userId],
    references: [appUsers.clerkUserId],
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(appUsers, {
    fields: [posts.userId],
    references: [appUsers.clerkUserId],
  }),
  postSegments: many(postSegments),
}));

export const subscribersRelations = relations(subscribers, ({ many }) => ({
  subscriberSegments: many(subscriberSegments),
}));

export const segmentsRelations = relations(segments, ({ many }) => ({
  subscriberSegments: many(subscriberSegments),
  postSegments: many(postSegments),
}));

export const subscriberSegmentsRelations = relations(subscriberSegments, ({ one }) => ({
  subscriber: one(subscribers, {
    fields: [subscriberSegments.subscriberId],
    references: [subscribers.id],
  }),
  segment: one(segments, {
    fields: [subscriberSegments.segmentId],
    references: [segments.id],
  }),
}));

export const postSegmentsRelations = relations(postSegments, ({ one }) => ({
  post: one(posts, {
    fields: [postSegments.postId],
    references: [posts.id],
  }),
  segment: one(segments, {
    fields: [postSegments.segmentId],
    references: [segments.id],
  }),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(appUsers, {
    fields: [userSubscriptions.userId],
    references: [appUsers.clerkUserId],
  }),
}));

export const publicSiteSettingsRelations = relations(publicSiteSettings, ({ one }) => ({
  user: one(appUsers, {
    fields: [publicSiteSettings.userId],
    references: [appUsers.clerkUserId],
  }),
}));

export const customDomainsRelations = relations(customDomains, ({ one }) => ({
  user: one(appUsers, {
    fields: [customDomains.userId],
    references: [appUsers.clerkUserId],
  }),
}));

export const imagesRelations = relations(images, ({ one }) => ({
  user: one(appUsers, {
    fields: [images.userId],
    references: [appUsers.clerkUserId],
  }),
}));

export const pricingPlansRelations = relations(pricingPlans, ({ many }) => ({
  subscriptions: many(organizationSubscriptions),
}));

export const organizationSubscriptionsRelations = relations(organizationSubscriptions, ({ one }) => ({
  plan: one(pricingPlans, {
    fields: [organizationSubscriptions.planId],
    references: [pricingPlans.id],
  }),
}));

// Relations for marketing sequences
export const marketingSequencesRelations = relations(marketingSequences, ({ one, many }) => ({
  user: one(appUsers, {
    fields: [marketingSequences.userId],
    references: [appUsers.clerkUserId],
  }),
  steps: many(sequenceSteps),
  enrollments: many(sequenceEnrollments),
}));

export const sequenceStepsRelations = relations(sequenceSteps, ({ one, many }) => ({
  sequence: one(marketingSequences, {
    fields: [sequenceSteps.sequenceId],
    references: [marketingSequences.id],
  }),
  enrollments: many(sequenceEnrollments, {
    relationName: 'currentStep',
  }),
  executions: many(sequenceStepExecutions),
}));

export const sequenceEnrollmentsRelations = relations(sequenceEnrollments, ({ one, many }) => ({
  sequence: one(marketingSequences, {
    fields: [sequenceEnrollments.sequenceId],
    references: [marketingSequences.id],
  }),
  subscriber: one(subscribers, {
    fields: [sequenceEnrollments.subscriberId],
    references: [subscribers.id],
  }),
  currentStep: one(sequenceSteps, {
    fields: [sequenceEnrollments.currentStepId],
    references: [sequenceSteps.id],
    relationName: 'currentStep',
  }),
  executions: many(sequenceStepExecutions),
}));

export const sequenceStepExecutionsRelations = relations(sequenceStepExecutions, ({ one }) => ({
  enrollment: one(sequenceEnrollments, {
    fields: [sequenceStepExecutions.enrollmentId],
    references: [sequenceEnrollments.id],
  }),
  step: one(sequenceSteps, {
    fields: [sequenceStepExecutions.stepId],
    references: [sequenceSteps.id],
  }),
}));