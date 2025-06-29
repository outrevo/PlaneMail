const perform = async (z, bundle) => {
  const email = bundle.inputData.email;

  const response = await z.request({
    url: 'https://planemail.in/api/v1/subscribers',
    method: 'GET',
    params: {
      email: email,
      limit: 1,
    },
  });

  const subscribers = response.json.subscribers || [];
  return subscribers;
};

module.exports = {
  key: 'findSubscriber',
  noun: 'Subscriber',
  display: {
    label: 'Find Subscriber',
    description: 'Finds a subscriber by email address.',
  },
  operation: {
    perform: perform,
    inputFields: [
      {
        key: 'email',
        label: 'Email Address',
        type: 'string',
        required: true,
        helpText: 'The email address to search for.',
      },
    ],
    sample: {
      id: 'sub_1234567890',
      email: 'john@example.com',
      name: 'John Doe',
      status: 'active',
      dateAdded: '2025-01-15T10:30:00Z',
    },
    outputFields: [
      { key: 'id', label: 'Subscriber ID' },
      { key: 'email', label: 'Email Address' },
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'dateAdded', label: 'Date Added' },
    ],
  },
};
