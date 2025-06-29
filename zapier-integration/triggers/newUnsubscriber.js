const subscribeHook = async (z, bundle) => {
  const hookData = {
    url: bundle.targetUrl,
    events: ['subscriber.unsubscribed'],
    description: 'Zapier trigger: New Unsubscriber',
  };

  const response = await z.request({
    url: 'https://planemail.in/api/v1/webhooks',
    method: 'POST',
    body: hookData,
  });

  return response.json;
};

const unsubscribeHook = async (z, bundle) => {
  const response = await z.request({
    url: `https://planemail.in/api/v1/webhooks?id=${bundle.subscribeData.webhook.id}`,
    method: 'DELETE',
  });

  return response.json;
};

const getUnsubscriber = (z, bundle) => {
  const subscriber = bundle.cleanedRequest.data.subscriber;
  return [subscriber];
};

module.exports = {
  key: 'newUnsubscriber',
  noun: 'Unsubscriber',
  display: {
    label: 'New Unsubscriber',
    description: 'Triggers when a subscriber unsubscribes from your emails.',
  },
  operation: {
    type: 'hook',
    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,
    perform: getUnsubscriber,
    performList: async (z, bundle) => {
      const response = await z.request({
        url: 'https://planemail.in/api/v1/subscribers',
        method: 'GET',
        params: {
          status: 'unsubscribed',
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
      dateUnsubscribed: '2025-01-15T10:30:00Z',
    },
    outputFields: [
      { key: 'id', label: 'Subscriber ID' },
      { key: 'email', label: 'Email Address' },
      { key: 'name', label: 'Name' },
      { key: 'dateUnsubscribed', label: 'Date Unsubscribed' },
    ],
  },
};
