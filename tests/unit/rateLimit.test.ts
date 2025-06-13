/**
 * Unit tests for rate limiting functionality
 */

import { describe, it, expect, beforeEach } from "bun:test";
import { RateLimitManager } from "../../src/rateLimit/manager.js";
import { 
  RATE_LIMIT_PROFILES, 
  getRateLimitProfile, 
  isRateLimitError,
  addJitter,
  calculateBackoffDelay 
} from "../../src/rateLimit/config.js";
import { TweetEstimator } from "../../src/rateLimit/estimator.js";

describe("Rate Limiting Configuration", () => {
  it("should have all required rate limit profiles", () => {
    expect(RATE_LIMIT_PROFILES.conservative).toBeDefined();
    expect(RATE_LIMIT_PROFILES.moderate).toBeDefined();
    expect(RATE_LIMIT_PROFILES.aggressive).toBeDefined();
  });

  it("should return conservative profile for invalid names", () => {
    const profile = getRateLimitProfile("invalid");
    expect(profile.name).toBe("Conservative");
  });

  it("should detect rate limit errors correctly", () => {
    expect(isRateLimitError({ status: 429 })).toBe(true);
    expect(isRateLimitError({ status: 503 })).toBe(true);
    expect(isRateLimitError({ message: "rate limit exceeded" })).toBe(true);
    expect(isRateLimitError({ status: 200 })).toBe(false);
  });

  it("should add jitter to delays", () => {
    const baseDelay = 1000;
    const jitteredDelay = addJitter(baseDelay, 25);
    
    // Should be within ±25% of base delay
    expect(jitteredDelay).toBeGreaterThanOrEqual(750);
    expect(jitteredDelay).toBeLessThanOrEqual(1250);
  });

  it("should calculate exponential backoff correctly", () => {
    const baseDelay = 1000;
    const attempt1 = calculateBackoffDelay(0, baseDelay);
    const attempt2 = calculateBackoffDelay(1, baseDelay);
    const attempt3 = calculateBackoffDelay(2, baseDelay);
    
    expect(attempt1).toBe(1000);  // 1000 * 2^0
    expect(attempt2).toBe(2000);  // 1000 * 2^1
    expect(attempt3).toBe(4000);  // 1000 * 2^2
  });
});

describe("Rate Limit Manager", () => {
  let rateLimiter: RateLimitManager;

  beforeEach(() => {
    rateLimiter = new RateLimitManager({
      profile: RATE_LIMIT_PROFILES.conservative
    });
  });

  it("should initialize with correct profile", () => {
    const status = rateLimiter.getStatus();
    expect(status.profile).toBe("Conservative");
  });

  it("should track request history", () => {
    rateLimiter.recordRequest(true, 200);
    rateLimiter.recordRequest(false, 429);
    
    const status = rateLimiter.getStatus();
    expect(status.consecutiveFailures).toBe(1);
  });

  it("should reset failures on success", () => {
    rateLimiter.recordRequest(false, 429);
    rateLimiter.recordRequest(false, 503);
    rateLimiter.recordRequest(true, 200);
    
    const status = rateLimiter.getStatus();
    expect(status.consecutiveFailures).toBe(0);
  });

  it("should recommend pausing after multiple failures", () => {
    rateLimiter.recordRequest(false, 429);
    rateLimiter.recordRequest(false, 429);
    
    expect(rateLimiter.shouldPauseScraping()).toBe(true);
  });

  it("should provide accurate status information", () => {
    const status = rateLimiter.getStatus();
    
    expect(status).toHaveProperty('profile');
    expect(status).toHaveProperty('requestsInLastMinute');
    expect(status).toHaveProperty('requestsInLastHour');
    expect(status).toHaveProperty('circuitBreakerOpen');
    expect(status).toHaveProperty('successRate');
  });
});

describe("Tweet Estimator", () => {
  it("should estimate collection time accurately", () => {
    const profile = RATE_LIMIT_PROFILES.conservative;
    const estimate = TweetEstimator.estimateCollectionTime(120, profile);
    
    // Conservative profile: 2 req/min, so 120 tweets should take 60 minutes
    expect(estimate.estimatedMinutes).toBe(60);
    expect(estimate.tweetsPerHour).toBe(60);
  });

  it("should compare profiles correctly", () => {
    const comparisons = TweetEstimator.compareProfiles(100);
    
    expect(comparisons.conservative).toBeDefined();
    expect(comparisons.moderate).toBeDefined();
    expect(comparisons.aggressive).toBeDefined();
    
    // Aggressive should be faster than conservative
    expect(comparisons.aggressive.estimatedMinutes).toBeLessThan(
      comparisons.conservative.estimatedMinutes
    );
  });

  it("should find optimal profile for time constraints", () => {
    const result = TweetEstimator.getOptimalProfile(60, 30); // 60 tweets in 30 minutes
    
    expect(result.feasible).toBe(true);
    expect(result.profile.name).toBe("Aggressive"); // Only aggressive can do 60 tweets in 30 min
  });

  it("should generate helpful recommendations", () => {
    const recommendations = TweetEstimator.getRecommendations(1000, 60);
    
    expect(recommendations.recommendation).toContain("tweets");
    expect(recommendations.alternatives).toBeInstanceOf(Array);
  });

  it("should calculate progress accurately", () => {
    const startTime = Date.now() - 30000; // 30 seconds ago
    const progress = TweetEstimator.calculateProgress(
      50, // collected
      100, // target
      startTime,
      RATE_LIMIT_PROFILES.conservative
    );
    
    expect(progress.percentage).toBe(50);
    expect(progress.currentRate).toBeGreaterThan(0);
    expect(progress.eta).toBeGreaterThan(Date.now());
  });

  it("should format estimates for display", () => {
    const estimate = TweetEstimator.estimateCollectionTime(100, RATE_LIMIT_PROFILES.conservative);
    const formatted = TweetEstimator.formatEstimate(estimate);
    
    expect(formatted).toContain("Estimated collection time");
    expect(formatted).toContain("tweets/hour");
    expect(formatted).toContain("risk");
  });
});

describe("Rate Limiting Integration", () => {
  it("should handle different profile configurations", () => {
    const profiles = ['conservative', 'moderate', 'aggressive'];
    
    profiles.forEach(profileName => {
      const manager = new RateLimitManager({
        profile: getRateLimitProfile(profileName)
      });
      
      const status = manager.getStatus();
      expect(status.profile).toBe(RATE_LIMIT_PROFILES[profileName].name);
    });
  });

  it("should provide consistent time estimates", () => {
    const tweetCount = 500;
    
    Object.values(RATE_LIMIT_PROFILES).forEach(profile => {
      const estimate = TweetEstimator.estimateCollectionTime(tweetCount, profile);
      
      expect(estimate.estimatedMinutes).toBeGreaterThan(0);
      expect(estimate.tweetsPerHour).toBe(profile.requestsPerHour);
      expect(estimate.riskAssessment).toContain(profile.riskLevel === 'low' ? '🟢' : 
                                                profile.riskLevel === 'medium' ? '🟡' : '🔴');
    });
  });
});

describe("Error Handling", () => {
  it("should handle various error types", () => {
    const errors = [
      { status: 429, message: "Too Many Requests" },
      { status: 503, message: "Service Unavailable" },
      { status: 401, message: "Unauthorized" },
      { message: "rate limit exceeded" },
      { message: "temporarily unavailable" }
    ];

    errors.forEach(error => {
      expect(isRateLimitError(error)).toBe(true);
    });
  });

  it("should not flag non-rate-limit errors", () => {
    const errors = [
      { status: 200, message: "OK" },
      { status: 404, message: "Not Found" },
      { message: "network error" },
      null,
      undefined
    ];

    errors.forEach(error => {
      expect(isRateLimitError(error)).toBe(false);
    });
  });
});
