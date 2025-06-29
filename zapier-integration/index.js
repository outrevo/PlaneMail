const authentication = require('./authentication');
const triggers = require('./triggers');
const creates = require('./creates');
const searches = require('./searches');

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  authentication: authentication,

  beforeRequest: [
    (request, z, bundle) => {
      // Add API key to headers if available
      if (bundle.authData.apiKey) {
        request.headers.Authorization = `Bearer ${bundle.authData.apiKey}`;
      }
      return request;
    }
  ],

  afterResponse: [
    (response, z, bundle) => {
      // Handle rate limiting
      if (response.status === 429) {
        throw new z.errors.ThrottledError('Rate limit exceeded. Please try again later.');
      }
      
      // Handle authentication errors
      if (response.status === 401) {
        throw new z.errors.RefreshAuthError('Your API key is invalid or expired.');
      }
      
      return response;
    }
  ],

  triggers: {
    [triggers.newSubscriber.key]: triggers.newSubscriber,
    [triggers.newUnsubscriber.key]: triggers.newUnsubscriber,
    [triggers.subscriberTagged.key]: triggers.subscriberTagged,
    [triggers.subscriberUntagged.key]: triggers.subscriberUntagged,
    [triggers.postPublished.key]: triggers.postPublished,
    [triggers.postSent.key]: triggers.postSent,
    [triggers.newSegment.key]: triggers.newSegment,
  },

  creates: {
    [creates.addSubscriber.key]: creates.addSubscriber,
    [creates.updateSubscriber.key]: creates.updateSubscriber,
    [creates.createSegment.key]: creates.createSegment,
    [creates.tagSubscriber.key]: creates.tagSubscriber,
    [creates.untagSubscriber.key]: creates.untagSubscriber,
  },

  searches: {
    [searches.findSubscriber.key]: searches.findSubscriber,
    [searches.listSegments.key]: searches.listSegments,
  },

  // Resources are used to define common data structures and API calls
  resources: {}
};
