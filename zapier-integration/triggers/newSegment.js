module.exports = {
  key: 'newSegment',
  noun: 'Segment',
  display: {
    label: 'New Segment',
    description: 'Triggers when a new segment (tag) is created.',
  },
  operation: {
    type: 'hook',
    performSubscribe: async (z, bundle) => {
      const hookData = {
        url: bundle.targetUrl,
        events: ['segment.created'],
        description: 'Zapier trigger: New Segment',
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
      const segment = bundle.cleanedRequest.data.segment;
      return [segment];
    },
    performList: async (z, bundle) => {
      const response = await z.request({
        url: 'https://planemail.in/api/v1/segments',
        method: 'GET',
        params: {
          limit: 3,
          sort: '-createdAt',
        },
      });
      return response.json.segments || [];
    },
    sample: {
      id: 'seg_1234567890',
      name: 'Newsletter Subscribers',
      description: 'Subscribers to our weekly newsletter',
      createdAt: '2025-01-15T10:30:00Z',
    },
  },
};
