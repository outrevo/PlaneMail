"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequenceStepExecutionsRelations = exports.sequenceEnrollmentsRelations = exports.sequenceStepsRelations = exports.marketingSequencesRelations = exports.sequenceStepExecutions = exports.sequenceEnrollments = exports.sequenceSteps = exports.marketingSequences = exports.organizationSubscriptionsRelations = exports.pricingPlansRelations = exports.imagesRelations = exports.customDomainsRelations = exports.publicSiteSettingsRelations = exports.userSubscriptionsRelations = exports.postSegmentsRelations = exports.subscriberSegmentsRelations = exports.segmentsRelations = exports.subscribersRelations = exports.postsRelations = exports.webhooksRelations = exports.apiKeysRelations = exports.userIntegrationsRelations = exports.appUsersRelations = exports.organizationUsage = exports.organizationSubscriptions = exports.pricingPlans = exports.images = exports.customDomains = exports.publicSiteSettings = exports.waitlistUsers = exports.userSubscriptions = exports.postSegments = exports.subscriberSegments = exports.segments = exports.subscribers = exports.posts = exports.webhooks = exports.apiKeys = exports.userIntegrations = exports.appUsers = exports.UserRole = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.UserRole = (0, pg_core_1.pgTable)('user_role', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 50 }).notNull().unique(),
    description: (0, pg_core_1.text)('description'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().$onUpdate(() => new Date()),
});
exports.appUsers = (0, pg_core_1.pgTable)('app_users', {
    clerkUserId: (0, pg_core_1.varchar)('clerk_user_id', { length: 255 }).primaryKey(),
    roleId: (0, pg_core_1.uuid)('role_id').references(() => exports.UserRole.id),
    // Compliance: Sender address for email compliance (CAN-SPAM, GDPR)
    senderAddressLine1: (0, pg_core_1.varchar)('sender_address_line1', { length: 255 }),
    senderAddressLine2: (0, pg_core_1.varchar)('sender_address_line2', { length: 255 }),
    senderCity: (0, pg_core_1.varchar)('sender_city', { length: 100 }),
    senderState: (0, pg_core_1.varchar)('sender_state', { length: 100 }),
    senderPostalCode: (0, pg_core_1.varchar)('sender_postal_code', { length: 20 }),
    senderCountry: (0, pg_core_1.varchar)('sender_country', { length: 100 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().$onUpdate(() => new Date()),
});
exports.userIntegrations = (0, pg_core_1.pgTable)('user_integrations', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.varchar)('user_id', { length: 255 }).notNull().references(() => exports.appUsers.clerkUserId, { onDelete: 'cascade' }),
    clerkOrgId: (0, pg_core_1.varchar)('clerk_org_id', { length: 255 }), // Clerk organization ID for team integrations
    provider: (0, pg_core_1.varchar)('provider', { length: 50 }).notNull(),
    apiKey: (0, pg_core_1.text)('api_key'), // For Brevo, Mailgun API Key, AWS Access Key ID
    secretApiKey: (0, pg_core_1.text)('secret_api_key'), // For AWS Secret Access Key
    status: (0, pg_core_1.varchar)('status', { length: 50 }).default('inactive').notNull(),
    meta: (0, pg_core_1.jsonb)('meta'),
    connectedAt: (0, pg_core_1.timestamp)('connected_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => {
    return {
        userProviderUnique: (0, pg_core_1.uniqueIndex)('user_provider_idx').on(table.userId, table.provider),
    };
});
exports.apiKeys = (0, pg_core_1.pgTable)('api_keys', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.varchar)('user_id', { length: 255 }).notNull().references(() => exports.appUsers.clerkUserId, { onDelete: 'cascade' }),
    clerkOrgId: (0, pg_core_1.varchar)('clerk_org_id', { length: 255 }), // Clerk organization ID for team API keys
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull(),
    prefix: (0, pg_core_1.varchar)('prefix', { length: 12 }).notNull().unique(),
    hashedKey: (0, pg_core_1.text)('hashed_key').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    lastUsedAt: (0, pg_core_1.timestamp)('last_used_at'),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
});
exports.webhooks = (0, pg_core_1.pgTable)('webhooks', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.varchar)('user_id', { length: 255 }).notNull().references(() => exports.appUsers.clerkUserId, { onDelete: 'cascade' }),
    clerkOrgId: (0, pg_core_1.varchar)('clerk_org_id', { length: 255 }), // Clerk organization ID for team webhooks
    url: (0, pg_core_1.text)('url').notNull(),
    events: (0, pg_core_1.jsonb)('events').notNull(), // Array of event types
    description: (0, pg_core_1.varchar)('description', { length: 255 }),
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    lastTriggeredAt: (0, pg_core_1.timestamp)('last_triggered_at'),
}, (table) => {
    return {
        userUrlUnique: (0, pg_core_1.uniqueIndex)('webhook_user_url_idx').on(table.userId, table.url),
    };
});
exports.posts = (0, pg_core_1.pgTable)('posts', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.varchar)('user_id', { length: 255 }).notNull(),
    clerkOrgId: (0, pg_core_1.varchar)('clerk_org_id', { length: 255 }), // Clerk organization ID for team posts
    // Basic post information
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    content: (0, pg_core_1.text)('content'), // Rich content/HTML
    excerpt: (0, pg_core_1.text)('excerpt'), // Short description for previews
    slug: (0, pg_core_1.varchar)('slug', { length: 255 }).notNull(), // URL-friendly identifier for web publishing
    // Publication settings
    status: (0, pg_core_1.varchar)('status', { length: 50 }).default('draft').notNull(), // draft, published, scheduled, sent
    publishedAt: (0, pg_core_1.timestamp)('published_at'),
    // Email publishing settings
    emailSubject: (0, pg_core_1.varchar)('email_subject', { length: 255 }), // Subject line when sent as email
    fromName: (0, pg_core_1.varchar)('from_name', { length: 255 }),
    fromEmail: (0, pg_core_1.varchar)('from_email', { length: 255 }),
    sentAt: (0, pg_core_1.timestamp)('sent_at'),
    recipientCount: (0, pg_core_1.integer)('recipient_count').default(0),
    sendingProviderId: (0, pg_core_1.varchar)('sending_provider_id', { length: 50 }),
    providerMessageId: (0, pg_core_1.text)('provider_message_id'),
    // Web publishing settings  
    webEnabled: (0, pg_core_1.boolean)('web_enabled').default(false), // Whether to publish as web page
    webPublishedAt: (0, pg_core_1.timestamp)('web_published_at'),
    seoTitle: (0, pg_core_1.varchar)('seo_title', { length: 255 }), // SEO title for web page
    seoDescription: (0, pg_core_1.text)('seo_description'), // SEO description for web page
    // Analytics
    totalOpens: (0, pg_core_1.integer)('total_opens').default(0).notNull(),
    uniqueOpens: (0, pg_core_1.integer)('unique_opens').default(0).notNull(),
    totalClicks: (0, pg_core_1.integer)('total_clicks').default(0).notNull(),
    uniqueClicks: (0, pg_core_1.integer)('unique_clicks').default(0).notNull(),
    totalBounces: (0, pg_core_1.integer)('total_bounces').default(0).notNull(),
    webViews: (0, pg_core_1.integer)('web_views').default(0).notNull(),
    firstOpenedAt: (0, pg_core_1.timestamp)('first_opened_at'),
    lastOpenedAt: (0, pg_core_1.timestamp)('last_opened_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => {
    return {
        userSlugUnique: (0, pg_core_1.uniqueIndex)('user_slug_idx').on(table.userId, table.slug),
    };
});
exports.subscribers = (0, pg_core_1.pgTable)('subscribers', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.varchar)('user_id', { length: 255 }).notNull(),
    clerkOrgId: (0, pg_core_1.varchar)('clerk_org_id', { length: 255 }), // Clerk organization ID for team subscribers
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).default('active').notNull(),
    dateAdded: (0, pg_core_1.timestamp)('date_added').defaultNow().notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().$onUpdate(() => new Date()),
    // Double opt-in: timestamp when subscriber confirmed
    confirmedAt: (0, pg_core_1.timestamp)('confirmed_at'),
}, (table) => {
    return {
        userEmailUnique: (0, pg_core_1.uniqueIndex)('user_email_idx').on(table.userId, table.email),
    };
});
exports.segments = (0, pg_core_1.pgTable)('segments', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.varchar)('user_id', { length: 255 }).notNull(),
    clerkOrgId: (0, pg_core_1.varchar)('clerk_org_id', { length: 255 }), // Clerk organization ID for team segments
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().$onUpdate(() => new Date()),
});
exports.subscriberSegments = (0, pg_core_1.pgTable)('subscriber_segments', {
    subscriberId: (0, pg_core_1.uuid)('subscriber_id').notNull().references(() => exports.subscribers.id, { onDelete: 'cascade' }),
    segmentId: (0, pg_core_1.uuid)('segment_id').notNull().references(() => exports.segments.id, { onDelete: 'cascade' }),
    assignedAt: (0, pg_core_1.timestamp)('assigned_at').defaultNow().notNull(),
}, (table) => {
    return {
        pk: (0, pg_core_1.primaryKey)({ columns: [table.subscriberId, table.segmentId] }),
    };
});
// Post-Segment relationship for audience targeting
exports.postSegments = (0, pg_core_1.pgTable)('post_segments', {
    postId: (0, pg_core_1.uuid)('post_id').notNull().references(() => exports.posts.id, { onDelete: 'cascade' }),
    segmentId: (0, pg_core_1.uuid)('segment_id').notNull().references(() => exports.segments.id, { onDelete: 'cascade' }),
    assignedAt: (0, pg_core_1.timestamp)('assigned_at').defaultNow().notNull(),
}, (table) => {
    return {
        pk: (0, pg_core_1.primaryKey)({ columns: [table.postId, table.segmentId] }),
    };
});
exports.userSubscriptions = (0, pg_core_1.pgTable)('user_subscriptions', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.varchar)('user_id', { length: 255 }).notNull().references(() => exports.appUsers.clerkUserId, { onDelete: 'cascade' }).unique(),
    paddleSubscriptionId: (0, pg_core_1.text)('paddle_subscription_id').unique(),
    paddlePlanId: (0, pg_core_1.text)('paddle_plan_id'),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).notNull(),
    currentPeriodStart: (0, pg_core_1.timestamp)('current_period_start'),
    currentPeriodEnd: (0, pg_core_1.timestamp)('current_period_end'),
    cancelAtPeriodEnd: (0, pg_core_1.boolean)('cancel_at_period_end').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().$onUpdate(() => new Date()),
});
exports.waitlistUsers = (0, pg_core_1.pgTable)('waitlist_users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
});
exports.publicSiteSettings = (0, pg_core_1.pgTable)('public_site_settings', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.varchar)('user_id', { length: 255 }).notNull().references(() => exports.appUsers.clerkUserId, { onDelete: 'cascade' }).unique(),
    // Basic site info
    siteName: (0, pg_core_1.varchar)('site_name', { length: 255 }).notNull().default('PlaneMail'),
    siteDescription: (0, pg_core_1.text)('site_description').default('Email marketing and newsletter platform'),
    baseUrl: (0, pg_core_1.text)('base_url'),
    logoUrl: (0, pg_core_1.text)('logo_url'),
    favicon: (0, pg_core_1.text)('favicon'),
    primaryColor: (0, pg_core_1.varchar)('primary_color', { length: 7 }).default('#1e40af'),
    // Header/Footer settings
    headerEnabled: (0, pg_core_1.boolean)('header_enabled').default(true),
    headerContent: (0, pg_core_1.text)('header_content'), // Custom HTML for header
    footerEnabled: (0, pg_core_1.boolean)('footer_enabled').default(true),
    footerContent: (0, pg_core_1.text)('footer_content'), // Custom HTML for footer
    // Features
    enableNewsletterSignup: (0, pg_core_1.boolean)('enable_newsletter_signup').default(true),
    // Allow user to decide if double opt-in is required
    enableDoubleOptIn: (0, pg_core_1.boolean)('enable_double_opt_in').default(false).notNull(),
    // Custom code
    customCss: (0, pg_core_1.text)('custom_css'),
    customJs: (0, pg_core_1.text)('custom_js'),
    analyticsCode: (0, pg_core_1.text)('analytics_code'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().$onUpdate(() => new Date()),
});
exports.customDomains = (0, pg_core_1.pgTable)('custom_domains', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.varchar)('user_id', { length: 255 }).notNull().references(() => exports.appUsers.clerkUserId, { onDelete: 'cascade' }),
    clerkOrgId: (0, pg_core_1.varchar)('clerk_org_id', { length: 255 }), // Clerk organization ID for team domains
    domain: (0, pg_core_1.varchar)('domain', { length: 255 }).notNull().unique(),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).notNull().default('pending'), // pending, verified, active, failed
    verificationToken: (0, pg_core_1.varchar)('verification_token', { length: 100 }),
    verifiedAt: (0, pg_core_1.timestamp)('verified_at'),
    sslStatus: (0, pg_core_1.varchar)('ssl_status', { length: 50 }).default('pending'), // pending, issued, renewed, failed
    sslIssuedAt: (0, pg_core_1.timestamp)('ssl_issued_at'),
    sslExpiresAt: (0, pg_core_1.timestamp)('ssl_expires_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().$onUpdate(() => new Date()),
});
// Images table for storing uploaded images
exports.images = (0, pg_core_1.pgTable)('images', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.varchar)('user_id', { length: 255 }).notNull().references(() => exports.appUsers.clerkUserId, { onDelete: 'cascade' }),
    clerkOrgId: (0, pg_core_1.varchar)('clerk_org_id', { length: 255 }), // Clerk organization ID for team images
    // File information
    filename: (0, pg_core_1.varchar)('filename', { length: 255 }).notNull(),
    originalUrl: (0, pg_core_1.text)('original_url').notNull(), // Original ImageKit or uploaded URL
    emailOptimizedUrl: (0, pg_core_1.text)('email_optimized_url'), // Email-optimized version
    thumbnailUrl: (0, pg_core_1.text)('thumbnail_url'), // Thumbnail version
    // Metadata
    fileSize: (0, pg_core_1.integer)('file_size'), // Size in bytes
    mimeType: (0, pg_core_1.varchar)('mime_type', { length: 100 }),
    width: (0, pg_core_1.integer)('width'),
    height: (0, pg_core_1.integer)('height'),
    // ImageKit specific
    imagekitFileId: (0, pg_core_1.varchar)('imagekit_file_id', { length: 255 }), // ImageKit file ID for management
    imagekitPath: (0, pg_core_1.text)('imagekit_path'), // Path in ImageKit
    // Organization
    folder: (0, pg_core_1.varchar)('folder', { length: 255 }).default('planemail/posts'), // Folder/category
    tags: (0, pg_core_1.jsonb)('tags'), // Array of tags for organization
    // Usage tracking
    isDeleted: (0, pg_core_1.boolean)('is_deleted').default(false),
    lastUsedAt: (0, pg_core_1.timestamp)('last_used_at'),
    usageCount: (0, pg_core_1.integer)('usage_count').default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().$onUpdate(() => new Date()),
});
// Pricing plans for team billing
exports.pricingPlans = (0, pg_core_1.pgTable)('pricing_plans', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull(),
    slug: (0, pg_core_1.varchar)('slug', { length: 100 }).notNull().unique(),
    description: (0, pg_core_1.text)('description'),
    price: (0, pg_core_1.integer)('price').notNull().default(0), // Price in cents
    billingInterval: (0, pg_core_1.varchar)('billing_interval', { length: 20 }).notNull().default('monthly'), // monthly, yearly
    // Limits
    maxSubscribers: (0, pg_core_1.integer)('max_subscribers').default(1000),
    maxPostsPerMonth: (0, pg_core_1.integer)('max_posts_per_month').default(10),
    maxCustomDomains: (0, pg_core_1.integer)('max_custom_domains').default(0),
    maxTeamMembers: (0, pg_core_1.integer)('max_team_members').default(1), // 1 = personal only, >1 = team allowed
    maxIntegrations: (0, pg_core_1.integer)('max_integrations').default(1),
    maxApiKeys: (0, pg_core_1.integer)('max_api_keys').default(2),
    maxWebhooks: (0, pg_core_1.integer)('max_webhooks').default(2),
    maxImageUploads: (0, pg_core_1.integer)('max_image_uploads').default(50), // per month
    maxEmailsPerMonth: (0, pg_core_1.integer)('max_emails_per_month').default(10000),
    // Organization/Team features (only on paid plans)
    allowOrganizations: (0, pg_core_1.boolean)('allow_organizations').default(false),
    allowAdvancedAnalytics: (0, pg_core_1.boolean)('allow_advanced_analytics').default(false),
    allowCustomDomains: (0, pg_core_1.boolean)('allow_custom_domains').default(false),
    allowApiAccess: (0, pg_core_1.boolean)('allow_api_access').default(false),
    // Features
    features: (0, pg_core_1.jsonb)('features'), // Array of feature flags
    // Paddle integration
    paddleProductId: (0, pg_core_1.text)('paddle_product_id'),
    paddlePriceId: (0, pg_core_1.text)('paddle_price_id'),
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    isDefault: (0, pg_core_1.boolean)('is_default').default(false), // Default plan for new personal accounts
    sortOrder: (0, pg_core_1.integer)('sort_order').default(0),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().$onUpdate(() => new Date()),
});
// Organization subscriptions (works with Clerk organizations)
exports.organizationSubscriptions = (0, pg_core_1.pgTable)('organization_subscriptions', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    clerkOrgId: (0, pg_core_1.varchar)('clerk_org_id', { length: 255 }).notNull().unique(), // Clerk organization ID
    planId: (0, pg_core_1.uuid)('plan_id').notNull().references(() => exports.pricingPlans.id),
    // Paddle integration
    paddleSubscriptionId: (0, pg_core_1.text)('paddle_subscription_id').unique(),
    paddleCustomerId: (0, pg_core_1.text)('paddle_customer_id'),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).notNull().default('active'), // active, canceled, past_due, trialing
    currentPeriodStart: (0, pg_core_1.timestamp)('current_period_start'),
    currentPeriodEnd: (0, pg_core_1.timestamp)('current_period_end'),
    trialStart: (0, pg_core_1.timestamp)('trial_start'),
    trialEnd: (0, pg_core_1.timestamp)('trial_end'),
    canceledAt: (0, pg_core_1.timestamp)('canceled_at'),
    cancelAtPeriodEnd: (0, pg_core_1.boolean)('cancel_at_period_end').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().$onUpdate(() => new Date()),
});
// Organization usage tracking
exports.organizationUsage = (0, pg_core_1.pgTable)('organization_usage', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    clerkOrgId: (0, pg_core_1.varchar)('clerk_org_id', { length: 255 }).notNull().unique(), // Clerk organization ID
    // Current usage counters
    currentSubscribers: (0, pg_core_1.integer)('current_subscribers').default(0),
    currentPostsThisMonth: (0, pg_core_1.integer)('current_posts_this_month').default(0),
    currentCustomDomains: (0, pg_core_1.integer)('current_custom_domains').default(0),
    currentTeamMembers: (0, pg_core_1.integer)('current_team_members').default(0),
    currentIntegrations: (0, pg_core_1.integer)('current_integrations').default(0),
    currentApiKeys: (0, pg_core_1.integer)('current_api_keys').default(0),
    currentWebhooks: (0, pg_core_1.integer)('current_webhooks').default(0),
    currentImageUploadsThisMonth: (0, pg_core_1.integer)('current_image_uploads_this_month').default(0),
    currentEmailsThisMonth: (0, pg_core_1.integer)('current_emails_this_month').default(0),
    // Usage period (monthly reset)
    usagePeriodStart: (0, pg_core_1.timestamp)('usage_period_start').defaultNow().notNull(),
    usagePeriodEnd: (0, pg_core_1.timestamp)('usage_period_end').notNull(),
    // Tracking
    lastResetAt: (0, pg_core_1.timestamp)('last_reset_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().$onUpdate(() => new Date()),
});
// Relations
exports.appUsersRelations = (0, drizzle_orm_1.relations)(exports.appUsers, ({ one, many }) => ({
    role: one(exports.UserRole, {
        fields: [exports.appUsers.roleId],
        references: [exports.UserRole.id],
    }),
    integrations: many(exports.userIntegrations),
    apiKeys: many(exports.apiKeys),
    webhooks: many(exports.webhooks),
    subscription: one(exports.userSubscriptions, {
        fields: [exports.appUsers.clerkUserId],
        references: [exports.userSubscriptions.userId],
    }),
    posts: many(exports.posts),
    images: many(exports.images),
    siteSettings: one(exports.publicSiteSettings, {
        fields: [exports.appUsers.clerkUserId],
        references: [exports.publicSiteSettings.userId],
    }),
    customDomain: one(exports.customDomains, {
        fields: [exports.appUsers.clerkUserId],
        references: [exports.customDomains.userId],
    }),
}));
exports.userIntegrationsRelations = (0, drizzle_orm_1.relations)(exports.userIntegrations, ({ one }) => ({
    user: one(exports.appUsers, {
        fields: [exports.userIntegrations.userId],
        references: [exports.appUsers.clerkUserId],
    }),
}));
exports.apiKeysRelations = (0, drizzle_orm_1.relations)(exports.apiKeys, ({ one }) => ({
    user: one(exports.appUsers, {
        fields: [exports.apiKeys.userId],
        references: [exports.appUsers.clerkUserId],
    }),
}));
exports.webhooksRelations = (0, drizzle_orm_1.relations)(exports.webhooks, ({ one }) => ({
    user: one(exports.appUsers, {
        fields: [exports.webhooks.userId],
        references: [exports.appUsers.clerkUserId],
    }),
}));
exports.postsRelations = (0, drizzle_orm_1.relations)(exports.posts, ({ one, many }) => ({
    user: one(exports.appUsers, {
        fields: [exports.posts.userId],
        references: [exports.appUsers.clerkUserId],
    }),
    postSegments: many(exports.postSegments),
}));
exports.subscribersRelations = (0, drizzle_orm_1.relations)(exports.subscribers, ({ many }) => ({
    subscriberSegments: many(exports.subscriberSegments),
}));
exports.segmentsRelations = (0, drizzle_orm_1.relations)(exports.segments, ({ many }) => ({
    subscriberSegments: many(exports.subscriberSegments),
    postSegments: many(exports.postSegments),
}));
exports.subscriberSegmentsRelations = (0, drizzle_orm_1.relations)(exports.subscriberSegments, ({ one }) => ({
    subscriber: one(exports.subscribers, {
        fields: [exports.subscriberSegments.subscriberId],
        references: [exports.subscribers.id],
    }),
    segment: one(exports.segments, {
        fields: [exports.subscriberSegments.segmentId],
        references: [exports.segments.id],
    }),
}));
exports.postSegmentsRelations = (0, drizzle_orm_1.relations)(exports.postSegments, ({ one }) => ({
    post: one(exports.posts, {
        fields: [exports.postSegments.postId],
        references: [exports.posts.id],
    }),
    segment: one(exports.segments, {
        fields: [exports.postSegments.segmentId],
        references: [exports.segments.id],
    }),
}));
exports.userSubscriptionsRelations = (0, drizzle_orm_1.relations)(exports.userSubscriptions, ({ one }) => ({
    user: one(exports.appUsers, {
        fields: [exports.userSubscriptions.userId],
        references: [exports.appUsers.clerkUserId],
    }),
}));
exports.publicSiteSettingsRelations = (0, drizzle_orm_1.relations)(exports.publicSiteSettings, ({ one }) => ({
    user: one(exports.appUsers, {
        fields: [exports.publicSiteSettings.userId],
        references: [exports.appUsers.clerkUserId],
    }),
}));
exports.customDomainsRelations = (0, drizzle_orm_1.relations)(exports.customDomains, ({ one }) => ({
    user: one(exports.appUsers, {
        fields: [exports.customDomains.userId],
        references: [exports.appUsers.clerkUserId],
    }),
}));
exports.imagesRelations = (0, drizzle_orm_1.relations)(exports.images, ({ one }) => ({
    user: one(exports.appUsers, {
        fields: [exports.images.userId],
        references: [exports.appUsers.clerkUserId],
    }),
}));
exports.pricingPlansRelations = (0, drizzle_orm_1.relations)(exports.pricingPlans, ({ many }) => ({
    subscriptions: many(exports.organizationSubscriptions),
}));
exports.organizationSubscriptionsRelations = (0, drizzle_orm_1.relations)(exports.organizationSubscriptions, ({ one }) => ({
    plan: one(exports.pricingPlans, {
        fields: [exports.organizationSubscriptions.planId],
        references: [exports.pricingPlans.id],
    }),
}));
// Marketing Automation Sequences
exports.marketingSequences = (0, pg_core_1.pgTable)('marketing_sequences', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.varchar)('user_id', { length: 255 }).notNull().references(() => exports.appUsers.clerkUserId, { onDelete: 'cascade' }),
    clerkOrgId: (0, pg_core_1.varchar)('clerk_org_id', { length: 255 }),
    // Basic sequence information
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    description: (0, pg_core_1.text)('description'),
    status: (0, pg_core_1.varchar)('status', { length: 50 }).default('draft').notNull(), // draft, active, paused, completed
    // Trigger configuration
    triggerType: (0, pg_core_1.varchar)('trigger_type', { length: 50 }).notNull(), // subscription, tag_added, tag_removed, manual, webhook, date_based
    triggerConfig: (0, pg_core_1.jsonb)('trigger_config').notNull(), // SequenceTriggerConfig
    // Sequence settings
    settings: (0, pg_core_1.jsonb)('settings').notNull(), // SequenceSettings
    // Statistics (updated periodically)
    stats: (0, pg_core_1.jsonb)('stats').default('{"totalEntered":0,"totalCompleted":0,"totalExited":0,"currentActive":0,"conversionRate":0,"avgCompletionTime":0,"stepStats":[]}').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().$onUpdate(() => new Date()),
});
exports.sequenceSteps = (0, pg_core_1.pgTable)('sequence_steps', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    sequenceId: (0, pg_core_1.uuid)('sequence_id').notNull().references(() => exports.marketingSequences.id, { onDelete: 'cascade' }),
    // Step configuration
    type: (0, pg_core_1.varchar)('type', { length: 50 }).notNull(), // email, wait, condition, action
    order: (0, pg_core_1.integer)('order').notNull(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    config: (0, pg_core_1.jsonb)('config').notNull(), // SequenceStepConfig
    isActive: (0, pg_core_1.boolean)('is_active').default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => {
    return {
        sequenceOrderIdx: (0, pg_core_1.uniqueIndex)('sequence_step_order_idx').on(table.sequenceId, table.order),
    };
});
exports.sequenceEnrollments = (0, pg_core_1.pgTable)('sequence_enrollments', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    sequenceId: (0, pg_core_1.uuid)('sequence_id').notNull().references(() => exports.marketingSequences.id, { onDelete: 'cascade' }),
    subscriberId: (0, pg_core_1.uuid)('subscriber_id').notNull().references(() => exports.subscribers.id, { onDelete: 'cascade' }),
    // Enrollment status
    status: (0, pg_core_1.varchar)('status', { length: 50 }).default('active').notNull(), // active, completed, exited, paused
    currentStepId: (0, pg_core_1.uuid)('current_step_id').references(() => exports.sequenceSteps.id),
    currentStepStartedAt: (0, pg_core_1.timestamp)('current_step_started_at'),
    nextScheduledAt: (0, pg_core_1.timestamp)('next_scheduled_at'),
    // Tracking
    enrolledAt: (0, pg_core_1.timestamp)('enrolled_at').defaultNow().notNull(),
    completedAt: (0, pg_core_1.timestamp)('completed_at'),
    exitedAt: (0, pg_core_1.timestamp)('exited_at'),
    exitReason: (0, pg_core_1.varchar)('exit_reason', { length: 255 }),
    // Custom data for this enrollment
    metadata: (0, pg_core_1.jsonb)('metadata').default('{}'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => {
    return {
        subscriberSequenceIdx: (0, pg_core_1.uniqueIndex)('subscriber_sequence_idx').on(table.subscriberId, table.sequenceId),
        nextScheduledIdx: (0, pg_core_1.uniqueIndex)('next_scheduled_idx').on(table.nextScheduledAt),
    };
});
exports.sequenceStepExecutions = (0, pg_core_1.pgTable)('sequence_step_executions', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    enrollmentId: (0, pg_core_1.uuid)('enrollment_id').notNull().references(() => exports.sequenceEnrollments.id, { onDelete: 'cascade' }),
    stepId: (0, pg_core_1.uuid)('step_id').notNull().references(() => exports.sequenceSteps.id, { onDelete: 'cascade' }),
    // Execution details
    status: (0, pg_core_1.varchar)('status', { length: 50 }).notNull(), // pending, executing, completed, failed, skipped
    startedAt: (0, pg_core_1.timestamp)('started_at'),
    completedAt: (0, pg_core_1.timestamp)('completed_at'),
    // Results
    result: (0, pg_core_1.jsonb)('result'), // Execution result data (email IDs, action results, etc.)
    error: (0, pg_core_1.text)('error'), // Error message if failed
    // Email-specific tracking
    emailJobId: (0, pg_core_1.varchar)('email_job_id', { length: 255 }), // BullMQ job ID
    emailMessageId: (0, pg_core_1.text)('email_message_id'), // Provider message ID
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().$onUpdate(() => new Date()),
});
// Relations for marketing sequences
exports.marketingSequencesRelations = (0, drizzle_orm_1.relations)(exports.marketingSequences, ({ one, many }) => ({
    user: one(exports.appUsers, {
        fields: [exports.marketingSequences.userId],
        references: [exports.appUsers.clerkUserId],
    }),
    steps: many(exports.sequenceSteps),
    enrollments: many(exports.sequenceEnrollments),
}));
exports.sequenceStepsRelations = (0, drizzle_orm_1.relations)(exports.sequenceSteps, ({ one, many }) => ({
    sequence: one(exports.marketingSequences, {
        fields: [exports.sequenceSteps.sequenceId],
        references: [exports.marketingSequences.id],
    }),
    enrollments: many(exports.sequenceEnrollments, {
        relationName: 'currentStep',
    }),
    executions: many(exports.sequenceStepExecutions),
}));
exports.sequenceEnrollmentsRelations = (0, drizzle_orm_1.relations)(exports.sequenceEnrollments, ({ one, many }) => ({
    sequence: one(exports.marketingSequences, {
        fields: [exports.sequenceEnrollments.sequenceId],
        references: [exports.marketingSequences.id],
    }),
    subscriber: one(exports.subscribers, {
        fields: [exports.sequenceEnrollments.subscriberId],
        references: [exports.subscribers.id],
    }),
    currentStep: one(exports.sequenceSteps, {
        fields: [exports.sequenceEnrollments.currentStepId],
        references: [exports.sequenceSteps.id],
        relationName: 'currentStep',
    }),
    executions: many(exports.sequenceStepExecutions),
}));
exports.sequenceStepExecutionsRelations = (0, drizzle_orm_1.relations)(exports.sequenceStepExecutions, ({ one }) => ({
    enrollment: one(exports.sequenceEnrollments, {
        fields: [exports.sequenceStepExecutions.enrollmentId],
        references: [exports.sequenceEnrollments.id],
    }),
    step: one(exports.sequenceSteps, {
        fields: [exports.sequenceStepExecutions.stepId],
        references: [exports.sequenceSteps.id],
    }),
}));
//# sourceMappingURL=schema.js.map