const subscribeHook = async (z, bundle) => {
  const hookData = {
    url: bundle.targetUrl,
    events: ['subscriber.tagged'],
    description: 'Zapier trigger: Subscriber Tagged',
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

const getTaggedSubscriber = (z, bundle) => {
  const data = bundle.cleanedRequest.data;
  return [{
    subscriber: data.subscriber,
    segment: data.segment,
  }];
};

module.exports = {
  key: 'subscriberTagged',
  noun: 'Tagged Subscriber',
  display: {
    label: 'Subscriber Added to Segment',
    description: 'Triggers when a subscriber is added to a specific segment (tag).',
  },
  operation: {
    type: 'hook',
    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,
    perform: getTaggedSubscriber,
    performList: async (z, bundle) => {
      // This is a bit complex to implement for testing, so return empty for now
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
    outputFields: [
      { key: 'subscriber__id', label: 'Subscriber ID' },
      { key: 'subscriber__email', label: 'Email Address' },
      { key: 'subscriber__name', label: 'Name' },
      { key: 'segment__id', label: 'Segment ID' },
      { key: 'segment__name', label: 'Segment Name' },
    ],
  },
};
