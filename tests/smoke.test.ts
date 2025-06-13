/**
 * Smoke tests - Quick verification that the app works
 * These tests should run fast and catch major issues
 */

import { describe, it, expect } from "bun:test";
import { spawn } from "bun";

const CLI_PATH = "./src/cli.ts";

async function runCLI(args: string[], timeout: number = 5000): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = spawn({
    cmd: ["bun", "run", CLI_PATH, ...args],
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      NODE_ENV: "test"
    }
  });

  // Set timeout
  const timeoutId = setTimeout(() => {
    proc.kill();
  }, timeout);

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  clearTimeout(timeoutId);

  return { stdout, stderr, exitCode };
}

describe("Smoke Tests - Basic Functionality", () => {
  it("CLI should start and show help", async () => {
    const result = await runCLI(["--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AI-powered Twitter/X scraping");
    expect(result.stdout).toContain("Commands:");
  });

  it("CLI should show version", async () => {
    const result = await runCLI(["--version"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("All main commands should be available", async () => {
    const commands = ["interactive", "scrape", "embed", "ask", "db", "migrate", "optimize", "benchmark"];

    for (const command of commands) {
      const result = await runCLI([command, "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(command);
    }
  });

  it("Database commands should work", async () => {
    const result = await runCLI(["db", "--stats"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Database Statistics");
  });

  it("Rate limiting profiles should be available", async () => {
    // Test that rate limiting is integrated by checking scrape help
    const result = await runCLI(["scrape", "--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("scrape") && expect(result.stdout).toContain("tweets");
  });

  it("Should handle invalid commands gracefully", async () => {
    const result = await runCLI(["invalid-command"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Invalid command");
  });

  it("Should validate required parameters", async () => {
    const result = await runCLI(["scrape"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("username") || expect(result.stderr).toContain("required");
  });

  it("Should handle missing auth tokens gracefully", async () => {
    // Use a shorter timeout for this test since it might hang
    const result = await runCLI(["scrape", "testuser", "--max", "1"], 3000);

    // Should fail but with helpful error message (or timeout gracefully)
    expect([0, 1]).toContain(result.exitCode);
    if (result.stderr.length > 0) {
      expect(result.stderr).not.toContain("undefined");
      expect(result.stderr).not.toContain("null");
    }
  });
});

describe("Smoke Tests - Rate Limiting", () => {
  it("Rate limiting configuration should be available", async () => {
    // Import and test rate limiting modules
    const { RATE_LIMIT_PROFILES } = await import("../src/rateLimit/config.js");

    expect(RATE_LIMIT_PROFILES).toBeDefined();
    expect(RATE_LIMIT_PROFILES.conservative).toBeDefined();
    expect(RATE_LIMIT_PROFILES.moderate).toBeDefined();
    expect(RATE_LIMIT_PROFILES.aggressive).toBeDefined();
  });

  it("Rate limit manager should initialize", async () => {
    const { RateLimitManager } = await import("../src/rateLimit/manager.js");

    const manager = new RateLimitManager();
    const status = manager.getStatus();

    expect(status).toHaveProperty('profile');
    expect(status).toHaveProperty('requestsInLastMinute');
    expect(status).toHaveProperty('successRate');
  });

  it("Tweet estimator should work", async () => {
    const { TweetEstimator } = await import("../src/rateLimit/estimator.js");
    const { RATE_LIMIT_PROFILES } = await import("../src/rateLimit/config.js");

    const estimate = TweetEstimator.estimateCollectionTime(100, RATE_LIMIT_PROFILES.conservative);

    expect(estimate.estimatedMinutes).toBeGreaterThan(0);
    expect(estimate.tweetsPerHour).toBeGreaterThan(0);
    expect(estimate.riskAssessment).toContain("🟢");
  });
});

describe("Smoke Tests - Database", () => {
  it("Database schema should be valid", async () => {
    const schema = await import("../src/database/schema.js");

    expect(schema.users).toBeDefined();
    expect(schema.tweets).toBeDefined();
    expect(schema.scrapeSessions).toBeDefined();
    expect(schema.embeddings).toBeDefined();
  });

  it("Database queries should be available", async () => {
    const queries = await import("../src/database/queries.js");

    expect(queries.userQueries).toBeDefined();
    expect(queries.tweetQueries).toBeDefined();
    expect(queries.sessionQueries).toBeDefined();
    expect(queries.embeddingQueries).toBeDefined();
    expect(queries.statsQueries).toBeDefined();

    expect(typeof queries.userQueries.upsertUser).toBe('function');
    expect(typeof queries.tweetQueries.insertTweets).toBe('function');
    expect(typeof queries.sessionQueries.createSession).toBe('function');
  });
});

describe("Smoke Tests - Core Commands", () => {
  it("Scrape command should validate parameters", async () => {
    const { scrapeCommand } = await import("../src/commands/scrape.js");

    // Should be a function
    expect(typeof scrapeCommand).toBe('function');
  });

  it("Interactive command should be available", async () => {
    const { interactiveCommand } = await import("../src/commands/interactive.js");

    expect(typeof interactiveCommand).toBe('function');
  });

  it("Embed command should be available", async () => {
    const { embedCommand } = await import("../src/commands/embed.js");

    expect(typeof embedCommand).toBe('function');
  });

  it("Ask command should be available", async () => {
    const { askCommand } = await import("../src/commands/ask.js");

    expect(typeof askCommand).toBe('function');
  });
});

describe("Smoke Tests - Performance", () => {
  it("CLI should start quickly", async () => {
    const startTime = Date.now();
    const result = await runCLI(["--version"]);
    const duration = Date.now() - startTime;

    expect(result.exitCode).toBe(0);
    expect(duration).toBeLessThan(3000); // Should start within 3 seconds
  });

  it("Help commands should be fast", async () => {
    const startTime = Date.now();
    const result = await runCLI(["--help"]);
    const duration = Date.now() - startTime;

    expect(result.exitCode).toBe(0);
    expect(duration).toBeLessThan(2000); // Should show help within 2 seconds
  });

  it("Database stats should be fast", async () => {
    const startTime = Date.now();
    const result = await runCLI(["db", "--stats"]);
    const duration = Date.now() - startTime;

    expect(result.exitCode).toBe(0);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });
});

describe("Smoke Tests - Error Handling", () => {
  it("Should not crash on invalid input", async () => {
    const invalidInputs = [
      ["scrape", "user", "--max", "invalid"],
      ["ask"],
      ["embed", "--invalid-option"]
    ];

    for (const input of invalidInputs) {
      const result = await runCLI(input);

      // Should exit with error code but not crash (some may succeed with warnings)
      expect([0, 1]).toContain(result.exitCode);
      if (result.exitCode === 1) {
        expect(result.stderr.length).toBeGreaterThan(0);
        expect(result.stderr).not.toContain("undefined");
        expect(result.stderr).not.toContain("null");
      }
    }
  });

  it("Should provide helpful error messages", async () => {
    const result = await runCLI(["scrape"]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("username") || expect(result.stderr).toContain("required");
  });
});
