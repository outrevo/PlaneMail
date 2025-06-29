const perform = async (z, bundle) => {
  const response = await z.request({
    url: 'https://planemail.in/api/v1/segments',
    method: 'GET',
  });

  return response.json.segments || [];
};

module.exports = {
  key: 'listSegments',
  noun: 'Segment',
  display: {
    label: 'List Segments',
    description: 'Retrieves all segments (tags) from your account.',
    hidden: true, // This is used for dynamic dropdowns
  },
  operation: {
    perform: perform,
    sample: {
      id: 'seg_1234567890',
      name: 'Newsletter Subscribers',
      description: 'Subscribers to our weekly newsletter',
      createdAt: '2025-01-15T10:30:00Z',
    },
  },
};
