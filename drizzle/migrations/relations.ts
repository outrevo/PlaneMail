import { relations } from "drizzle-orm/relations";
import { userRole, appUsers, apiKeys, userSubscriptions, publicSiteSettings, userIntegrations, webhooks, customDomains, images, pricingPlans, organizationSubscriptions, marketingSequences, sequenceEnrollments, subscribers, sequenceSteps, sequenceStepExecutions, subscriberSegments, segments, posts, postSegments } from "./schema";

export const appUsersRelations = relations(appUsers, ({one, many}) => ({
	userRole: one(userRole, {
		fields: [appUsers.roleId],
		references: [userRole.id]
	}),
	apiKeys: many(apiKeys),
	userSubscriptions: many(userSubscriptions),
	publicSiteSettings: many(publicSiteSettings),
	userIntegrations: many(userIntegrations),
	webhooks: many(webhooks),
	customDomains: many(customDomains),
	images: many(images),
	marketingSequences: many(marketingSequences),
}));

export const userRoleRelations = relations(userRole, ({many}) => ({
	appUsers: many(appUsers),
}));

export const apiKeysRelations = relations(apiKeys, ({one}) => ({
	appUser: one(appUsers, {
		fields: [apiKeys.userId],
		references: [appUsers.clerkUserId]
	}),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({one}) => ({
	appUser: one(appUsers, {
		fields: [userSubscriptions.userId],
		references: [appUsers.clerkUserId]
	}),
}));

export const publicSiteSettingsRelations = relations(publicSiteSettings, ({one}) => ({
	appUser: one(appUsers, {
		fields: [publicSiteSettings.userId],
		references: [appUsers.clerkUserId]
	}),
}));

export const userIntegrationsRelations = relations(userIntegrations, ({one}) => ({
	appUser: one(appUsers, {
		fields: [userIntegrations.userId],
		references: [appUsers.clerkUserId]
	}),
}));

export const webhooksRelations = relations(webhooks, ({one}) => ({
	appUser: one(appUsers, {
		fields: [webhooks.userId],
		references: [appUsers.clerkUserId]
	}),
}));

export const customDomainsRelations = relations(customDomains, ({one}) => ({
	appUser: one(appUsers, {
		fields: [customDomains.userId],
		references: [appUsers.clerkUserId]
	}),
}));

export const imagesRelations = relations(images, ({one}) => ({
	appUser: one(appUsers, {
		fields: [images.userId],
		references: [appUsers.clerkUserId]
	}),
}));

export const organizationSubscriptionsRelations = relations(organizationSubscriptions, ({one}) => ({
	pricingPlan: one(pricingPlans, {
		fields: [organizationSubscriptions.planId],
		references: [pricingPlans.id]
	}),
}));

export const pricingPlansRelations = relations(pricingPlans, ({many}) => ({
	organizationSubscriptions: many(organizationSubscriptions),
}));

export const marketingSequencesRelations = relations(marketingSequences, ({one, many}) => ({
	appUser: one(appUsers, {
		fields: [marketingSequences.userId],
		references: [appUsers.clerkUserId]
	}),
	sequenceEnrollments: many(sequenceEnrollments),
	sequenceSteps: many(sequenceSteps),
}));

export const sequenceEnrollmentsRelations = relations(sequenceEnrollments, ({one, many}) => ({
	marketingSequence: one(marketingSequences, {
		fields: [sequenceEnrollments.sequenceId],
		references: [marketingSequences.id]
	}),
	subscriber: one(subscribers, {
		fields: [sequenceEnrollments.subscriberId],
		references: [subscribers.id]
	}),
	sequenceStep: one(sequenceSteps, {
		fields: [sequenceEnrollments.currentStepId],
		references: [sequenceSteps.id]
	}),
	sequenceStepExecutions: many(sequenceStepExecutions),
}));

export const subscribersRelations = relations(subscribers, ({many}) => ({
	sequenceEnrollments: many(sequenceEnrollments),
	subscriberSegments: many(subscriberSegments),
}));

export const sequenceStepsRelations = relations(sequenceSteps, ({one, many}) => ({
	sequenceEnrollments: many(sequenceEnrollments),
	marketingSequence: one(marketingSequences, {
		fields: [sequenceSteps.sequenceId],
		references: [marketingSequences.id]
	}),
	sequenceStepExecutions: many(sequenceStepExecutions),
}));

export const sequenceStepExecutionsRelations = relations(sequenceStepExecutions, ({one}) => ({
	sequenceEnrollment: one(sequenceEnrollments, {
		fields: [sequenceStepExecutions.enrollmentId],
		references: [sequenceEnrollments.id]
	}),
	sequenceStep: one(sequenceSteps, {
		fields: [sequenceStepExecutions.stepId],
		references: [sequenceSteps.id]
	}),
}));

export const subscriberSegmentsRelations = relations(subscriberSegments, ({one}) => ({
	subscriber: one(subscribers, {
		fields: [subscriberSegments.subscriberId],
		references: [subscribers.id]
	}),
	segment: one(segments, {
		fields: [subscriberSegments.segmentId],
		references: [segments.id]
	}),
}));

export const segmentsRelations = relations(segments, ({many}) => ({
	subscriberSegments: many(subscriberSegments),
	postSegments: many(postSegments),
}));

export const postSegmentsRelations = relations(postSegments, ({one}) => ({
	post: one(posts, {
		fields: [postSegments.postId],
		references: [posts.id]
	}),
	segment: one(segments, {
		fields: [postSegments.segmentId],
		references: [segments.id]
	}),
}));

export const postsRelations = relations(posts, ({many}) => ({
	postSegments: many(postSegments),
}));