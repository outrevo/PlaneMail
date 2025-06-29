const perform = async (z, bundle) => {
  const subscriberId = bundle.inputData.subscriberId;
  const segments = bundle.inputData.segments || [];

  const response = await z.request({
    url: `https://planemail.in/api/v1/subscribers/${subscriberId}`,
    method: 'PATCH',
    body: {
      removeSegments: segments,
    },
  });

  return response.json;
};

module.exports = {
  key: 'untagSubscriber',
  noun: 'Untagged Subscriber',
  display: {
    label: 'Untag Subscriber',
    description: 'Removes a subscriber from one or more segments (tags).',
  },
  operation: {
    perform: perform,
    inputFields: [
      {
        key: 'subscriberId',
        label: 'Subscriber ID',
        type: 'string',
        required: true,
        helpText: 'The ID of the subscriber to untag.',
      },
      {
        key: 'segments',
        label: 'Segments',
        type: 'string',
        list: true,
        required: true,
        helpText: 'Segment IDs to remove the subscriber from.',
      },
    ],
    sample: {
      message: 'Subscriber untagged successfully.',
    },
  },
};
