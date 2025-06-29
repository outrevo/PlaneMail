const testAuth = async (z, bundle) => {
  // Test the API key by making a simple request
  const response = await z.request({
    url: 'https://planemail.in/api/v1/subscribers',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${bundle.authData.apiKey}`,
    },
  });

  if (response.status !== 200) {
    throw new Error('Invalid API key');
  }

  return response.json;
};

module.exports = {
  type: 'custom',
  test: testAuth,
  fields: [
    {
      computed: false,
      key: 'apiKey',
      required: true,
      label: 'API Key',
      type: 'string',
      helpText: 'Get your API key from PlaneMail Dashboard > Settings > API Keys. Create a new key if you don\'t have one.',
    },
  ],
  customConfig: {},
  connectionLabel: 'PlaneMail Account',
};
