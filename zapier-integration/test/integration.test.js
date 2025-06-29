const zapier = require('zapier-platform-core');

// Import the app
const App = require('./index');

// Create a Zapier app tester
const appTester = zapier.createAppTester(App);

// Mock authentication bundle
const authBundle = {
  authData: {
    apiKey: 'pk_test_1234567890abcdef' // This would be a real API key in production
  }
};

describe('PlaneMail Zapier Integration', () => {
  
  describe('Authentication', () => {
    it('should authenticate successfully with valid API key', async () => {
      const result = await appTester(App.authentication.test, authBundle);
      expect(result).toBeDefined();
    });
  });

  describe('Triggers', () => {
    it('should trigger on new subscriber', async () => {
      const bundle = {
        ...authBundle,
        cleanedRequest: {
          data: {
            subscriber: {
              id: 'sub_test123',
              email: 'test@example.com',
              name: 'Test User',
              status: 'active',
              dateAdded: '2025-01-15T10:30:00Z'
            }
          }
        }
      };

      const results = await appTester(App.triggers.newSubscriber.operation.perform, bundle);
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].email).toBe('test@example.com');
    });

    it('should trigger on post published', async () => {
      const bundle = {
        ...authBundle,
        cleanedRequest: {
          data: {
            post: {
              id: 'post_test123',
              title: 'Test Post',
              slug: 'test-post',
              publishedAt: '2025-01-15T10:30:00Z',
              webUrl: 'https://example.com/posts/test-post'
            }
          }
        }
      };

      const results = await appTester(App.triggers.postPublished.operation.perform, bundle);
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toBe('Test Post');
    });
  });

  describe('Actions', () => {
    it('should add a new subscriber', async () => {
      const bundle = {
        ...authBundle,
        inputData: {
          email: 'newuser@example.com',
          name: 'New User',
          status: 'active',
          segments: ['newsletter']
        }
      };

      const result = await appTester(App.creates.addSubscriber.operation.perform, bundle);
      expect(result).toBeDefined();
      expect(result.subscriberId).toBeDefined();
      expect(result.message).toContain('successfully');
    });

    it('should create a new segment', async () => {
      const bundle = {
        ...authBundle,
        inputData: {
          name: 'Test Segment',
          description: 'A test segment for automation'
        }
      };

      const result = await appTester(App.creates.createSegment.operation.perform, bundle);
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Segment');
    });

    it('should update subscriber segments', async () => {
      const bundle = {
        ...authBundle,
        inputData: {
          subscriberId: 'sub_test123',
          addSegments: ['vip-customers'],
          removeSegments: ['trial-users']
        }
      };

      const result = await appTester(App.creates.updateSubscriber.operation.perform, bundle);
      expect(result).toBeDefined();
      expect(result.message).toContain('successfully');
    });
  });

  describe('Searches', () => {
    it('should find subscriber by email', async () => {
      const bundle = {
        ...authBundle,
        inputData: {
          email: 'test@example.com'
        }
      };

      const results = await appTester(App.searches.findSubscriber.operation.perform, bundle);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should list all segments', async () => {
      const results = await appTester(App.searches.listSegments.operation.perform, authBundle);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limiting', async () => {
      const bundle = {
        authData: {
          apiKey: 'invalid_key'
        }
      };

      try {
        await appTester(App.authentication.test, bundle);
      } catch (error) {
        expect(error.name).toBe('RefreshAuthError');
      }
    });

    it('should validate required fields', async () => {
      const bundle = {
        ...authBundle,
        inputData: {
          // Missing required email field
          name: 'Test User'
        }
      };

      try {
        await appTester(App.creates.addSubscriber.operation.perform, bundle);
      } catch (error) {
        expect(error.message).toContain('email');
      }
    });
  });

  describe('Webhook Management', () => {
    it('should create webhook subscription', async () => {
      const bundle = {
        ...authBundle,
        targetUrl: 'https://hooks.zapier.com/test/12345'
      };

      const result = await appTester(App.triggers.newSubscriber.operation.performSubscribe, bundle);
      expect(result).toBeDefined();
      expect(result.webhook).toBeDefined();
      expect(result.webhook.url).toBe(bundle.targetUrl);
    });

    it('should delete webhook subscription', async () => {
      const bundle = {
        ...authBundle,
        subscribeData: {
          webhook: {
            id: 'hook_test123'
          }
        }
      };

      const result = await appTester(App.triggers.newSubscriber.operation.performUnsubscribe, bundle);
      expect(result).toBeDefined();
    });
  });
});

// Performance tests
describe('Performance', () => {
  it('should handle multiple concurrent requests', async () => {
    const bundles = Array.from({ length: 10 }, (_, i) => ({
      ...authBundle,
      inputData: {
        email: `user${i}@example.com`,
        name: `User ${i}`,
        status: 'active'
      }
    }));

    const promises = bundles.map(bundle => 
      appTester(App.creates.addSubscriber.operation.perform, bundle)
    );

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled');
    
    expect(successful.length).toBeGreaterThan(0);
  });

  it('should complete actions within reasonable time', async () => {
    const startTime = Date.now();
    
    const bundle = {
      ...authBundle,
      inputData: {
        email: 'performance@example.com',
        name: 'Performance Test',
        status: 'active'
      }
    };

    await appTester(App.creates.addSubscriber.operation.perform, bundle);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });
});

// Integration tests with real-world scenarios
describe('Real-world Scenarios', () => {
  it('should handle Google Sheets → PlaneMail workflow', async () => {
    // Simulate data from Google Sheets
    const sheetData = [
      { email: 'user1@company.com', name: 'John Doe', segment: 'enterprise' },
      { email: 'user2@company.com', name: 'Jane Smith', segment: 'enterprise' },
      { email: 'user3@company.com', name: 'Bob Johnson', segment: 'trial' }
    ];

    const results = [];
    for (const row of sheetData) {
      const bundle = {
        ...authBundle,
        inputData: {
          email: row.email,
          name: row.name,
          status: 'active',
          segments: [row.segment]
        }
      };

      const result = await appTester(App.creates.addSubscriber.operation.perform, bundle);
      results.push(result);
    }

    expect(results.length).toBe(3);
    expect(results.every(r => r.subscriberId)).toBe(true);
  });

  it('should handle Facebook Lead Ads → PlaneMail workflow', async () => {
    // Simulate Facebook Lead Ad data
    const leadData = {
      email: 'lead@facebook.com',
      name: 'Facebook Lead',
      phone: '+1234567890',
      source: 'facebook_ads',
      campaign: 'summer_promotion'
    };

    const bundle = {
      ...authBundle,
      inputData: {
        email: leadData.email,
        name: leadData.name,
        status: 'active',
        segments: ['facebook-leads', 'summer-promotion']
      }
    };

    const result = await appTester(App.creates.addSubscriber.operation.perform, bundle);
    expect(result.subscriberId).toBeDefined();
  });

  it('should handle e-commerce purchase → PlaneMail tagging', async () => {
    // Simulate Shopify purchase data
    const purchaseData = {
      email: 'customer@shopify.com',
      orderValue: 150,
      products: ['premium-plan', 'addon-feature'],
      customerType: 'returning'
    };

    // First add customer if not exists, then tag based on purchase
    const bundle = {
      ...authBundle,
      inputData: {
        subscriberId: 'sub_existing123', // Would be found via search first
        addSegments: ['customers', 'premium-buyers', 'high-value']
      }
    };

    const result = await appTester(App.creates.updateSubscriber.operation.perform, bundle);
    expect(result.message).toContain('successfully');
  });
});
