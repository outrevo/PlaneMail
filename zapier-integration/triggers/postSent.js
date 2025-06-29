const subscribeHook = async (z, bundle) => {
  const hookData = {
    url: bundle.targetUrl,
    events: ['post.sent'],
    description: 'Zapier trigger: Post Sent',
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

const getSentPost = (z, bundle) => {
  const data = bundle.cleanedRequest.data;
  return [{
    post: data.post,
    email: data.email,
  }];
};

module.exports = {
  key: 'postSent',
  noun: 'Sent Post',
  display: {
    label: 'Post Sent via Email',
    description: 'Triggers when a post is sent to subscribers via email.',
  },
  operation: {
    type: 'hook',
    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,
    perform: getSentPost,
    performList: async (z, bundle) => {
      // This would require a sent emails log - return empty for now
      return [];
    },
    sample: {
      post: {
        id: 'post_1234567890',
        title: 'Welcome to Our Newsletter',
        slug: 'welcome-to-our-newsletter',
      },
      email: {
        sentAt: '2025-01-15T10:30:00Z',
        recipientCount: 1250,
        provider: 'brevo',
      }
    },
    outputFields: [
      { key: 'post__id', label: 'Post ID' },
      { key: 'post__title', label: 'Post Title' },
      { key: 'post__slug', label: 'Post Slug' },
      { key: 'email__sentAt', label: 'Sent At' },
      { key: 'email__recipientCount', label: 'Recipient Count', type: 'integer' },
      { key: 'email__provider', label: 'Email Provider' },
    ],
  },
};
