const perform = async (z, bundle) => {
  const subscriberId = bundle.inputData.subscriberId;
  const updateData = {
    name: bundle.inputData.name,
    status: bundle.inputData.status,
    addSegments: bundle.inputData.addSegments || [],
    removeSegments: bundle.inputData.removeSegments || [],
  };

  // Remove undefined values
  Object.keys(updateData).forEach(key => {
    if (updateData[key] === undefined || updateData[key] === '') {
      delete updateData[key];
    }
  });

  const response = await z.request({
    url: `https://planemail.in/api/v1/subscribers/${subscriberId}`,
    method: 'PATCH',
    body: updateData,
  });

  return response.json;
};

module.exports = {
  key: 'updateSubscriber',
  noun: 'Subscriber',
  display: {
    label: 'Update Subscriber',
    description: 'Updates an existing subscriber\'s information and segments.',
  },
  operation: {
    perform: perform,
    inputFields: [
      {
        key: 'subscriberId',
        label: 'Subscriber ID',
        type: 'string',
        required: true,
        helpText: 'The ID of the subscriber to update.',
      },
      {
        key: 'name',
        label: 'Name',
        type: 'string',
        required: false,
        helpText: 'Update the subscriber\'s name.',
      },
      {
        key: 'status',
        label: 'Status',
        type: 'string',
        required: false,
        choices: {
          'active': 'Active',
          'pending': 'Pending',
          'unsubscribed': 'Unsubscribed',
          'bounced': 'Bounced',
        },
        helpText: 'Update the subscriber\'s status.',
      },
      {
        key: 'addSegments',
        label: 'Add to Segments',
        type: 'string',
        list: true,
        required: false,
        helpText: 'Segment IDs to add the subscriber to.',
      },
      {
        key: 'removeSegments',
        label: 'Remove from Segments',
        type: 'string',
        list: true,
        required: false,
        helpText: 'Segment IDs to remove the subscriber from.',
      },
    ],
    sample: {
      message: 'Subscriber updated successfully.',
    },
  },
};
