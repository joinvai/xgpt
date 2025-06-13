/**
 * Test setup and utilities
 */

import { beforeAll, afterAll } from "bun:test";
import { unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";

// Test database paths
export const TEST_DB_PATHS = [
  "./test_tweets.db",
  "./test_e2e_tweets.db",
  "./test_integration_tweets.db"
];

// Test environment variables
export const TEST_ENV = {
  NODE_ENV: "test",
  DATABASE_URL: "file:./test_tweets.db",
  AUTH_TOKEN: "test_auth_token_for_testing",
  CT0: "test_ct0_token_for_testing",
  OPENAI_API_KEY: "test_openai_key_for_testing"
};

// Global test setup
beforeAll(async () => {
  console.log("🧪 Setting up test environment...");
  
  // Clean up any existing test databases
  for (const dbPath of TEST_DB_PATHS) {
    if (existsSync(dbPath)) {
      await unlink(dbPath);
      console.log(`   Cleaned up ${dbPath}`);
    }
  }
  
  // Ensure test directories exist
  const testDirs = ["./tests/temp", "./tests/fixtures"];
  for (const dir of testDirs) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
      console.log(`   Created ${dir}`);
    }
  }
  
  console.log("✅ Test environment ready");
});

// Global test cleanup
afterAll(async () => {
  console.log("🧹 Cleaning up test environment...");
  
  // Clean up test databases
  for (const dbPath of TEST_DB_PATHS) {
    if (existsSync(dbPath)) {
      await unlink(dbPath);
      console.log(`   Cleaned up ${dbPath}`);
    }
  }
  
  console.log("✅ Test cleanup complete");
});

// Test utilities
export class TestUtils {
  static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  static generateTestData(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      id: `test_tweet_${i}`,
      text: `This is test tweet number ${i}`,
      username: "testuser",
      created_at: new Date(Date.now() - i * 1000).toISOString()
    }));
  }
  
  static mockRateLimitError() {
    return {
      status: 429,
      message: "Too Many Requests",
      headers: {
        'x-rate-limit-remaining': '0',
        'x-rate-limit-reset': Math.floor(Date.now() / 1000) + 900
      }
    };
  }
  
  static mockNetworkError() {
    return {
      code: 'ECONNREFUSED',
      message: 'Connection refused'
    };
  }
  
  static validateCliOutput(output: string, expectedPatterns: string[]) {
    const results = expectedPatterns.map(pattern => ({
      pattern,
      found: output.includes(pattern)
    }));
    
    return {
      allFound: results.every(r => r.found),
      results
    };
  }
}

// Mock data for testing
export const MOCK_TWEETS = [
  {
    id: "1234567890",
    text: "This is a test tweet about AI and machine learning",
    username: "testuser",
    created_at: "2024-01-01T12:00:00Z",
    isRetweet: false,
    isReply: false,
    likes: 10,
    retweets: 5
  },
  {
    id: "1234567891",
    text: "Another test tweet discussing technology trends",
    username: "testuser",
    created_at: "2024-01-02T12:00:00Z",
    isRetweet: false,
    isReply: true,
    likes: 15,
    retweets: 3
  },
  {
    id: "1234567892",
    text: "RT @someone: This is a retweet for testing",
    username: "testuser",
    created_at: "2024-01-03T12:00:00Z",
    isRetweet: true,
    isReply: false,
    likes: 8,
    retweets: 12
  }
];

export const MOCK_USER = {
  id: "user123",
  username: "testuser",
  displayName: "Test User",
  bio: "This is a test user for testing purposes",
  followers: 1000,
  following: 500,
  verified: false
};

// Test assertions
export class TestAssertions {
  static assertValidTweet(tweet: any) {
    if (!tweet.id) throw new Error("Tweet missing id");
    if (!tweet.text) throw new Error("Tweet missing text");
    if (!tweet.username) throw new Error("Tweet missing username");
    if (!tweet.created_at) throw new Error("Tweet missing created_at");
  }
  
  static assertValidUser(user: any) {
    if (!user.id) throw new Error("User missing id");
    if (!user.username) throw new Error("User missing username");
  }
  
  static assertValidSession(session: any) {
    if (!session.id) throw new Error("Session missing id");
    if (!session.userId) throw new Error("Session missing userId");
    if (!session.status) throw new Error("Session missing status");
  }
  
  static assertRateLimitStatus(status: any) {
    const requiredFields = [
      'profile',
      'requestsInLastMinute',
      'requestsInLastHour',
      'circuitBreakerOpen',
      'successRate'
    ];
    
    for (const field of requiredFields) {
      if (!(field in status)) {
        throw new Error(`Rate limit status missing ${field}`);
      }
    }
  }
}

// Performance testing utilities
export class PerformanceUtils {
  static async measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    return { result, duration };
  }
  
  static async measureMemory<T>(fn: () => Promise<T>): Promise<{ result: T; memoryUsed: number }> {
    const initialMemory = process.memoryUsage().heapUsed;
    const result = await fn();
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryUsed = finalMemory - initialMemory;
    return { result, memoryUsed };
  }
}

// Environment helpers
export function isCI(): boolean {
  return process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
}

export function skipIfNoAuth(): boolean {
  return !process.env.AUTH_TOKEN || !process.env.CT0;
}

export function skipIfNoOpenAI(): boolean {
  return !process.env.OPENAI_API_KEY;
}
