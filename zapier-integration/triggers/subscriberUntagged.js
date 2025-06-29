// Similar structure for other triggers...
module.exports = {
  key: 'subscriberUntagged',
  noun: 'Untagged Subscriber',
  display: {
    label: 'Subscriber Removed From Segment',
    description: 'Triggers when a subscriber is removed from a specific segment (tag).',
  },
  operation: {
    type: 'hook',
    performSubscribe: async (z, bundle) => {
      const hookData = {
        url: bundle.targetUrl,
        events: ['subscriber.untagged'],
        description: 'Zapier trigger: Subscriber Untagged',
      };
      const response = await z.request({
        url: 'https://planemail.in/api/v1/webhooks',
        method: 'POST',
        body: hookData,
      });
      return response.json;
    },
    performUnsubscribe: async (z, bundle) => {
      const response = await z.request({
        url: `https://planemail.in/api/v1/webhooks?id=${bundle.subscribeData.webhook.id}`,
        method: 'DELETE',
      });
      return response.json;
    },
    perform: (z, bundle) => {
      const data = bundle.cleanedRequest.data;
      return [{
        subscriber: data.subscriber,
        segment: data.segment,
      }];
    },
    performList: async (z, bundle) => {
      return [];
    },
    sample: {
      subscriber: {
        id: 'sub_1234567890',
        email: 'john@example.com',
        name: 'John Doe',
      },
      segment: {
        id: 'seg_newsletter',
        name: 'Newsletter Subscribers',
      }
    },
  },
};
