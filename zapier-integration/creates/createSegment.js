const perform = async (z, bundle) => {
  const segmentData = {
    name: bundle.inputData.name,
    description: bundle.inputData.description,
  };

  const response = await z.request({
    url: 'https://planemail.in/api/v1/segments',
    method: 'POST',
    body: segmentData,
  });

  return response.json.segment;
};

module.exports = {
  key: 'createSegment',
  noun: 'Segment',
  display: {
    label: 'Create Segment',
    description: 'Creates a new segment (tag) in your PlaneMail account.',
  },
  operation: {
    perform: perform,
    inputFields: [
      {
        key: 'name',
        label: 'Segment Name',
        type: 'string',
        required: true,
        helpText: 'A unique name for the segment.',
      },
      {
        key: 'description',
        label: 'Description',
        type: 'text',
        required: false,
        helpText: 'Optional description for the segment.',
      },
    ],
    sample: {
      id: 'seg_1234567890',
      name: 'Newsletter Subscribers',
      description: 'Subscribers to our weekly newsletter',
      createdAt: '2025-01-15T10:30:00Z',
    },
    outputFields: [
      { key: 'id', label: 'Segment ID' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'createdAt', label: 'Created At' },
    ],
  },
};
