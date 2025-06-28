
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const userIntegrations = pgTable('user_integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => appUsers.clerkUserId, { onDelete: 'cascade' }),
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
  name: varchar('name', { length: 100 }).notNull(),
  prefix: varchar('prefix', { length: 12 }).notNull().unique(), 
  hashedKey: text('hashed_key').notNull(), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
});

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  
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
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  status: varchar('status', { length: 50 }).default('active').notNull(), 
  dateAdded: timestamp('date_added').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
}, (table) => {
  return {
    userEmailUnique: uniqueIndex('user_email_idx').on(table.userId, table.email),
  };
});

export const segments = pgTable('segments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(), 
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


// Relations
export const appUsersRelations = relations(appUsers, ({ one, many }) => ({
  role: one(UserRole, {
    fields: [appUsers.roleId],
    references: [UserRole.id],
  }),
  integrations: many(userIntegrations),
  apiKeys: many(apiKeys), 
  subscription: one(userSubscriptions, { 
    fields: [appUsers.clerkUserId],
    references: [userSubscriptions.userId],
  }),
  posts: many(posts),
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

export const waitlistUsers = pgTable('waitlist_users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});