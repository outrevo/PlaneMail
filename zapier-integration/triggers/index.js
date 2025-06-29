const newSubscriber = require('./newSubscriber');
const newUnsubscriber = require('./newUnsubscriber');
const subscriberTagged = require('./subscriberTagged');
const subscriberUntagged = require('./subscriberUntagged');
const postPublished = require('./postPublished');
const postSent = require('./postSent');
const newSegment = require('./newSegment');

module.exports = {
  newSubscriber,
  newUnsubscriber,
  subscriberTagged,
  subscriberUntagged,
  postPublished,
  postSent,
  newSegment,
};
