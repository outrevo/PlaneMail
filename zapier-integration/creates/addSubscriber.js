const perform = async (z, bundle) => {
  const subscriberData = {
    email: bundle.inputData.email,
    name: bundle.inputData.name,
    status: bundle.inputData.status || 'active',
    segmentNames: bundle.inputData.segments || [],
  };

  const response = await z.request({
    url: 'https://planemail.in/api/v1/subscribers',
    method: 'POST',
    body: subscriberData,
  });

  return response.json;
};

module.exports = {
  key: 'addSubscriber',
  noun: 'Subscriber',
  display: {
    label: 'Add Subscriber',
    description: 'Adds a new subscriber to your PlaneMail account.',
  },
  operation: {
    perform: perform,
    inputFields: [
      {
        key: 'email',
        label: 'Email Address',
        type: 'string',
        required: true,
        helpText: 'The subscriber\'s email address.',
      },
      {
        key: 'name',
        label: 'Name',
        type: 'string',
        required: false,
        helpText: 'The subscriber\'s full name.',
      },
      {
        key: 'status',
        label: 'Status',
        type: 'string',
        required: false,
        default: 'active',
        choices: {
          'active': 'Active',
          'pending': 'Pending',
          'unsubscribed': 'Unsubscribed',
          'bounced': 'Bounced',
        },
        helpText: 'The subscriber\'s status.',
      },
      {
        key: 'segments',
        label: 'Segments',
        type: 'string',
        list: true,
        required: false,
        helpText: 'Segments (tags) to add the subscriber to. Enter segment IDs separated by commas.',
      },
    ],
    sample: {
      subscriberId: 'sub_1234567890',
      message: 'Subscriber added successfully.',
    },
    outputFields: [
      { key: 'subscriberId', label: 'Subscriber ID' },
      { key: 'message', label: 'Success Message' },
    ],
  },
};
