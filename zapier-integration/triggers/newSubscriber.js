const subscribeHook = async (z, bundle) => {
  // Create a webhook subscription for new subscribers
  const hookData = {
    url: bundle.targetUrl,
    events: ['subscriber.created'],
    description: 'Zapier trigger: New Subscriber',
  };

  const response = await z.request({
    url: 'https://planemail.in/api/v1/webhooks',
    method: 'POST',
    body: hookData,
  });

  return response.json;
};

const unsubscribeHook = async (z, bundle) => {
  // Remove the webhook subscription
  const response = await z.request({
    url: `https://planemail.in/api/v1/webhooks?id=${bundle.subscribeData.webhook.id}`,
    method: 'DELETE',
  });

  return response.json;
};

const getSubscriber = (z, bundle) => {
  // Parse the webhook payload
  const subscriber = bundle.cleanedRequest.data.subscriber;
  
  return [subscriber];
};

module.exports = {
  key: 'newSubscriber',
  noun: 'Subscriber',
  display: {
    label: 'New Subscriber',
    description: 'Triggers when a new subscriber is added to your PlaneMail account.',
  },
  operation: {
    type: 'hook',
    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,
    perform: getSubscriber,
    performList: async (z, bundle) => {
      // For testing - return recent subscribers
      const response = await z.request({
        url: 'https://planemail.in/api/v1/subscribers',
        method: 'GET',
        params: {
          limit: 3,
          sort: '-dateAdded',
        },
      });
      return response.json.subscribers || [];
    },
    sample: {
      id: 'sub_1234567890',
      email: 'john@example.com',
      name: 'John Doe',
      status: 'active',
      dateAdded: '2025-01-15T10:30:00Z',
      segments: [
        {
          id: 'seg_newsletter',
          name: 'Newsletter Subscribers',
        }
      ]
    },
    outputFields: [
      { key: 'id', label: 'Subscriber ID' },
      { key: 'email', label: 'Email Address' },
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'dateAdded', label: 'Date Added' },
      { key: 'segments[]id', label: 'Segment ID' },
      { key: 'segments[]name', label: 'Segment Name' },
    ],
  },
};
