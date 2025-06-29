const subscribeHook = async (z, bundle) => {
  const hookData = {
    url: bundle.targetUrl,
    events: ['post.published'],
    description: 'Zapier trigger: Post Published',
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

const getPublishedPost = (z, bundle) => {
  const post = bundle.cleanedRequest.data.post;
  return [post];
};

module.exports = {
  key: 'postPublished',
  noun: 'Published Post',
  display: {
    label: 'New Published Post',
    description: 'Triggers when a new post is published to the web.',
  },
  operation: {
    type: 'hook',
    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,
    perform: getPublishedPost,
    performList: async (z, bundle) => {
      const response = await z.request({
        url: 'https://planemail.in/api/v1/posts',
        method: 'GET',
        params: {
          status: 'published',
          limit: 3,
          sort: '-publishedAt',
        },
      });
      return response.json.posts || [];
    },
    sample: {
      id: 'post_1234567890',
      title: 'Welcome to Our Newsletter',
      slug: 'welcome-to-our-newsletter',
      publishedAt: '2025-01-15T10:30:00Z',
      webUrl: 'https://yoursite.com/posts/welcome-to-our-newsletter',
    },
    outputFields: [
      { key: 'id', label: 'Post ID' },
      { key: 'title', label: 'Title' },
      { key: 'slug', label: 'Slug' },
      { key: 'publishedAt', label: 'Published At' },
      { key: 'webUrl', label: 'Web URL' },
    ],
  },
};
