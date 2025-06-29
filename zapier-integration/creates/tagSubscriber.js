const perform = async (z, bundle) => {
  const subscriberId = bundle.inputData.subscriberId;
  const segments = bundle.inputData.segments || [];

  const response = await z.request({
    url: `https://planemail.in/api/v1/subscribers/${subscriberId}`,
    method: 'PATCH',
    body: {
      addSegments: segments,
    },
  });

  return response.json;
};

module.exports = {
  key: 'tagSubscriber',
  noun: 'Tagged Subscriber',
  display: {
    label: 'Tag Subscriber',
    description: 'Adds a subscriber to one or more segments (tags).',
  },
  operation: {
    perform: perform,
    inputFields: [
      {
        key: 'subscriberId',
        label: 'Subscriber ID',
        type: 'string',
        required: true,
        helpText: 'The ID of the subscriber to tag.',
      },
      {
        key: 'segments',
        label: 'Segments',
        type: 'string',
        list: true,
        required: true,
        helpText: 'Segment IDs to add the subscriber to.',
      },
    ],
    sample: {
      message: 'Subscriber tagged successfully.',
    },
  },
};
