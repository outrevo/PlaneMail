import { pgTable, unique, uuid, varchar, text, timestamp, foreignKey, uniqueIndex, boolean, serial, integer, jsonb, primaryKey } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"



export const userRole = pgTable("user_role", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 50 }).notNull(),
	description: text("description"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		userRoleNameUnique: unique("user_role_name_unique").on(table.name),
	}
});

export const segments = pgTable("segments", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	clerkOrgId: varchar("clerk_org_id", { length: 255 }),
});

export const appUsers = pgTable("app_users", {
	clerkUserId: varchar("clerk_user_id", { length: 255 }).primaryKey().notNull(),
	roleId: uuid("role_id").references(() => userRole.id),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	senderAddressLine1: varchar("sender_address_line1", { length: 255 }),
	senderAddressLine2: varchar("sender_address_line2", { length: 255 }),
	senderCity: varchar("sender_city", { length: 100 }),
	senderState: varchar("sender_state", { length: 100 }),
	senderPostalCode: varchar("sender_postal_code", { length: 20 }),
	senderCountry: varchar("sender_country", { length: 100 }),
});

export const subscribers = pgTable("subscribers", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull(),
	name: varchar("name", { length: 255 }),
	status: varchar("status", { length: 50 }).default('active'::character varying).notNull(),
	dateAdded: timestamp("date_added", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	clerkOrgId: varchar("clerk_org_id", { length: 255 }),
	confirmedAt: timestamp("confirmed_at", { mode: 'string' }),
},
(table) => {
	return {
		userEmailIdx: uniqueIndex("user_email_idx").using("btree", table.userId, table.email),
	}
});

export const apiKeys = pgTable("api_keys", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull().references(() => appUsers.clerkUserId, { onDelete: "cascade" } ),
	name: varchar("name", { length: 100 }).notNull(),
	prefix: varchar("prefix", { length: 12 }).notNull(),
	hashedKey: text("hashed_key").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	clerkOrgId: varchar("clerk_org_id", { length: 255 }),
},
(table) => {
	return {
		apiKeysPrefixUnique: unique("api_keys_prefix_unique").on(table.prefix),
	}
});

export const userSubscriptions = pgTable("user_subscriptions", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull().references(() => appUsers.clerkUserId, { onDelete: "cascade" } ),
	paddleSubscriptionId: text("paddle_subscription_id"),
	paddlePlanId: text("paddle_plan_id"),
	status: varchar("status", { length: 50 }).notNull(),
	currentPeriodStart: timestamp("current_period_start", { mode: 'string' }),
	currentPeriodEnd: timestamp("current_period_end", { mode: 'string' }),
	cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		userSubscriptionsUserIdUnique: unique("user_subscriptions_user_id_unique").on(table.userId),
		userSubscriptionsPaddleSubscriptionIdUnique: unique("user_subscriptions_paddle_subscription_id_unique").on(table.paddleSubscriptionId),
	}
});

export const waitlistUsers = pgTable("waitlist_users", {
	id: serial("id").primaryKey().notNull(),
	email: text("email").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		waitlistUsersEmailUnique: unique("waitlist_users_email_unique").on(table.email),
	}
});

export const organizationUsage = pgTable("organization_usage", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	clerkOrgId: varchar("clerk_org_id", { length: 255 }).notNull(),
	currentSubscribers: integer("current_subscribers").default(0),
	currentPostsThisMonth: integer("current_posts_this_month").default(0),
	currentCustomDomains: integer("current_custom_domains").default(0),
	currentTeamMembers: integer("current_team_members").default(0),
	currentIntegrations: integer("current_integrations").default(0),
	currentApiKeys: integer("current_api_keys").default(0),
	currentWebhooks: integer("current_webhooks").default(0),
	currentImageUploadsThisMonth: integer("current_image_uploads_this_month").default(0),
	currentEmailsThisMonth: integer("current_emails_this_month").default(0),
	usagePeriodStart: timestamp("usage_period_start", { mode: 'string' }).defaultNow().notNull(),
	usagePeriodEnd: timestamp("usage_period_end", { mode: 'string' }).notNull(),
	lastResetAt: timestamp("last_reset_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		organizationUsageClerkOrgIdUnique: unique("organization_usage_clerk_org_id_unique").on(table.clerkOrgId),
	}
});

export const publicSiteSettings = pgTable("public_site_settings", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull().references(() => appUsers.clerkUserId, { onDelete: "cascade" } ),
	siteName: varchar("site_name", { length: 255 }).default('PlaneMail'::character varying).notNull(),
	siteDescription: text("site_description").default('Email marketing and newsletter platform'),
	baseUrl: text("base_url"),
	logoUrl: text("logo_url"),
	favicon: text("favicon"),
	primaryColor: varchar("primary_color", { length: 7 }).default('#1e40af'::character varying),
	headerEnabled: boolean("header_enabled").default(true),
	headerContent: text("header_content"),
	footerEnabled: boolean("footer_enabled").default(true),
	footerContent: text("footer_content"),
	enableNewsletterSignup: boolean("enable_newsletter_signup").default(true),
	customCss: text("custom_css"),
	customJs: text("custom_js"),
	analyticsCode: text("analytics_code"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	enableDoubleOptIn: boolean("enable_double_opt_in").default(false).notNull(),
},
(table) => {
	return {
		publicSiteSettingsUserIdUnique: unique("public_site_settings_user_id_unique").on(table.userId),
	}
});

export const posts = pgTable("posts", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	title: varchar("title", { length: 255 }).notNull(),
	content: text("content"),
	excerpt: text("excerpt"),
	slug: varchar("slug", { length: 255 }).notNull(),
	status: varchar("status", { length: 50 }).default('draft'::character varying).notNull(),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	emailSubject: varchar("email_subject", { length: 255 }),
	fromName: varchar("from_name", { length: 255 }),
	fromEmail: varchar("from_email", { length: 255 }),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	recipientCount: integer("recipient_count").default(0),
	sendingProviderId: varchar("sending_provider_id", { length: 50 }),
	providerMessageId: text("provider_message_id"),
	webEnabled: boolean("web_enabled").default(false),
	webPublishedAt: timestamp("web_published_at", { mode: 'string' }),
	seoTitle: varchar("seo_title", { length: 255 }),
	seoDescription: text("seo_description"),
	totalOpens: integer("total_opens").default(0).notNull(),
	uniqueOpens: integer("unique_opens").default(0).notNull(),
	totalClicks: integer("total_clicks").default(0).notNull(),
	uniqueClicks: integer("unique_clicks").default(0).notNull(),
	totalBounces: integer("total_bounces").default(0).notNull(),
	webViews: integer("web_views").default(0).notNull(),
	firstOpenedAt: timestamp("first_opened_at", { mode: 'string' }),
	lastOpenedAt: timestamp("last_opened_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	clerkOrgId: varchar("clerk_org_id", { length: 255 }),
},
(table) => {
	return {
		userSlugIdx: uniqueIndex("user_slug_idx").using("btree", table.userId, table.slug),
	}
});

export const userIntegrations = pgTable("user_integrations", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull().references(() => appUsers.clerkUserId, { onDelete: "cascade" } ),
	provider: varchar("provider", { length: 50 }).notNull(),
	apiKey: text("api_key"),
	status: varchar("status", { length: 50 }).default('inactive'::character varying).notNull(),
	meta: jsonb("meta"),
	connectedAt: timestamp("connected_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	secretApiKey: text("secret_api_key"),
	clerkOrgId: varchar("clerk_org_id", { length: 255 }),
},
(table) => {
	return {
		userProviderIdx: uniqueIndex("user_provider_idx").using("btree", table.userId, table.provider),
	}
});

export const webhooks = pgTable("webhooks", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull().references(() => appUsers.clerkUserId, { onDelete: "cascade" } ),
	url: text("url").notNull(),
	events: jsonb("events").notNull(),
	description: varchar("description", { length: 255 }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	lastTriggeredAt: timestamp("last_triggered_at", { mode: 'string' }),
	clerkOrgId: varchar("clerk_org_id", { length: 255 }),
},
(table) => {
	return {
		webhookUserUrlIdx: uniqueIndex("webhook_user_url_idx").using("btree", table.userId, table.url),
	}
});

export const customDomains = pgTable("custom_domains", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull().references(() => appUsers.clerkUserId, { onDelete: "cascade" } ),
	clerkOrgId: varchar("clerk_org_id", { length: 255 }),
	domain: varchar("domain", { length: 255 }).notNull(),
	status: varchar("status", { length: 50 }).default('pending'::character varying).notNull(),
	verificationToken: varchar("verification_token", { length: 100 }),
	verifiedAt: timestamp("verified_at", { mode: 'string' }),
	sslStatus: varchar("ssl_status", { length: 50 }).default('pending'::character varying),
	sslIssuedAt: timestamp("ssl_issued_at", { mode: 'string' }),
	sslExpiresAt: timestamp("ssl_expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		customDomainsDomainUnique: unique("custom_domains_domain_unique").on(table.domain),
	}
});

export const images = pgTable("images", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull().references(() => appUsers.clerkUserId, { onDelete: "cascade" } ),
	clerkOrgId: varchar("clerk_org_id", { length: 255 }),
	filename: varchar("filename", { length: 255 }).notNull(),
	originalUrl: text("original_url").notNull(),
	emailOptimizedUrl: text("email_optimized_url"),
	thumbnailUrl: text("thumbnail_url"),
	fileSize: integer("file_size"),
	mimeType: varchar("mime_type", { length: 100 }),
	width: integer("width"),
	height: integer("height"),
	imagekitFileId: varchar("imagekit_file_id", { length: 255 }),
	imagekitPath: text("imagekit_path"),
	folder: varchar("folder", { length: 255 }).default('planemail/posts'::character varying),
	tags: jsonb("tags"),
	isDeleted: boolean("is_deleted").default(false),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
	usageCount: integer("usage_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const pricingPlans = pgTable("pricing_plans", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	slug: varchar("slug", { length: 100 }).notNull(),
	description: text("description"),
	price: integer("price").default(0).notNull(),
	billingInterval: varchar("billing_interval", { length: 20 }).default('monthly'::character varying).notNull(),
	maxSubscribers: integer("max_subscribers").default(1000),
	maxPostsPerMonth: integer("max_posts_per_month").default(10),
	maxCustomDomains: integer("max_custom_domains").default(0),
	maxTeamMembers: integer("max_team_members").default(1),
	maxIntegrations: integer("max_integrations").default(1),
	maxApiKeys: integer("max_api_keys").default(2),
	maxWebhooks: integer("max_webhooks").default(2),
	maxImageUploads: integer("max_image_uploads").default(50),
	maxEmailsPerMonth: integer("max_emails_per_month").default(10000),
	allowOrganizations: boolean("allow_organizations").default(false),
	allowAdvancedAnalytics: boolean("allow_advanced_analytics").default(false),
	allowCustomDomains: boolean("allow_custom_domains").default(false),
	allowApiAccess: boolean("allow_api_access").default(false),
	features: jsonb("features"),
	paddleProductId: text("paddle_product_id"),
	paddlePriceId: text("paddle_price_id"),
	isActive: boolean("is_active").default(true),
	isDefault: boolean("is_default").default(false),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		pricingPlansSlugUnique: unique("pricing_plans_slug_unique").on(table.slug),
	}
});

export const organizationSubscriptions = pgTable("organization_subscriptions", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	clerkOrgId: varchar("clerk_org_id", { length: 255 }).notNull(),
	planId: uuid("plan_id").notNull().references(() => pricingPlans.id),
	paddleSubscriptionId: text("paddle_subscription_id"),
	paddleCustomerId: text("paddle_customer_id"),
	status: varchar("status", { length: 50 }).default('active'::character varying).notNull(),
	currentPeriodStart: timestamp("current_period_start", { mode: 'string' }),
	currentPeriodEnd: timestamp("current_period_end", { mode: 'string' }),
	trialStart: timestamp("trial_start", { mode: 'string' }),
	trialEnd: timestamp("trial_end", { mode: 'string' }),
	canceledAt: timestamp("canceled_at", { mode: 'string' }),
	cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		organizationSubscriptionsClerkOrgIdUnique: unique("organization_subscriptions_clerk_org_id_unique").on(table.clerkOrgId),
		organizationSubscriptionsPaddleSubscriptionIdUnique: unique("organization_subscriptions_paddle_subscription_id_unique").on(table.paddleSubscriptionId),
	}
});

export const marketingSequences = pgTable("marketing_sequences", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull().references(() => appUsers.clerkUserId, { onDelete: "cascade" } ),
	clerkOrgId: varchar("clerk_org_id", { length: 255 }),
	name: varchar("name", { length: 255 }).notNull(),
	description: text("description"),
	status: varchar("status", { length: 50 }).default('draft'::character varying).notNull(),
	triggerType: varchar("trigger_type", { length: 50 }).notNull(),
	triggerConfig: jsonb("trigger_config").notNull(),
	settings: jsonb("settings").notNull(),
	stats: jsonb("stats").default({"stepStats":[],"totalExited":0,"totalEntered":0,"currentActive":0,"conversionRate":0,"totalCompleted":0,"avgCompletionTime":0}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const sequenceEnrollments = pgTable("sequence_enrollments", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	sequenceId: uuid("sequence_id").notNull().references(() => marketingSequences.id, { onDelete: "cascade" } ),
	subscriberId: uuid("subscriber_id").notNull().references(() => subscribers.id, { onDelete: "cascade" } ),
	status: varchar("status", { length: 50 }).default('active'::character varying).notNull(),
	currentStepId: uuid("current_step_id").references(() => sequenceSteps.id),
	currentStepStartedAt: timestamp("current_step_started_at", { mode: 'string' }),
	nextScheduledAt: timestamp("next_scheduled_at", { mode: 'string' }),
	enrolledAt: timestamp("enrolled_at", { mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	exitedAt: timestamp("exited_at", { mode: 'string' }),
	exitReason: varchar("exit_reason", { length: 255 }),
	metadata: jsonb("metadata").default({}),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		nextScheduledIdx: uniqueIndex("next_scheduled_idx").using("btree", table.nextScheduledAt),
		subscriberSequenceIdx: uniqueIndex("subscriber_sequence_idx").using("btree", table.subscriberId, table.sequenceId),
	}
});

export const sequenceSteps = pgTable("sequence_steps", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	sequenceId: uuid("sequence_id").notNull().references(() => marketingSequences.id, { onDelete: "cascade" } ),
	type: varchar("type", { length: 50 }).notNull(),
	order: integer("order").notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	config: jsonb("config").notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		sequenceStepOrderIdx: uniqueIndex("sequence_step_order_idx").using("btree", table.sequenceId, table.order),
	}
});

export const sequenceStepExecutions = pgTable("sequence_step_executions", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	enrollmentId: uuid("enrollment_id").notNull().references(() => sequenceEnrollments.id, { onDelete: "cascade" } ),
	stepId: uuid("step_id").notNull().references(() => sequenceSteps.id, { onDelete: "cascade" } ),
	status: varchar("status", { length: 50 }).notNull(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	result: jsonb("result"),
	error: text("error"),
	emailJobId: varchar("email_job_id", { length: 255 }),
	emailMessageId: text("email_message_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const subscriberSegments = pgTable("subscriber_segments", {
	subscriberId: uuid("subscriber_id").notNull().references(() => subscribers.id, { onDelete: "cascade" } ),
	segmentId: uuid("segment_id").notNull().references(() => segments.id, { onDelete: "cascade" } ),
	assignedAt: timestamp("assigned_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		subscriberSegmentsSubscriberIdSegmentIdPk: primaryKey({ columns: [table.subscriberId, table.segmentId], name: "subscriber_segments_subscriber_id_segment_id_pk"}),
	}
});

export const postSegments = pgTable("post_segments", {
	postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" } ),
	segmentId: uuid("segment_id").notNull().references(() => segments.id, { onDelete: "cascade" } ),
	assignedAt: timestamp("assigned_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		postSegmentsPostIdSegmentIdPk: primaryKey({ columns: [table.postId, table.segmentId], name: "post_segments_post_id_segment_id_pk"}),
	}
});