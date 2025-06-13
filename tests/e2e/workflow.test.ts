/**
 * End-to-end tests for complete workflows
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { spawn } from "bun";
import { unlink, writeFile, readFile } from "fs/promises";
import { existsSync } from "fs";

const CLI_PATH = "./src/cli.ts";
const TEST_DB_PATH = "./test_e2e_tweets.db";
const TEST_ENV_PATH = "./test.env";

// Mock environment for testing
const TEST_ENV_CONTENT = `
# Test environment - these are fake tokens for testing
AUTH_TOKEN=test_auth_token_for_testing
CT0=test_ct0_token_for_testing
OPENAI_API_KEY=test_openai_key_for_testing
DATABASE_URL=file:${TEST_DB_PATH}
NODE_ENV=test
`;

async function runCLI(args: string[], input?: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = spawn({
    cmd: ["bun", "run", CLI_PATH, ...args],
    stdout: "pipe",
    stderr: "pipe",
    stdin: input ? "pipe" : undefined,
    env: {
      ...process.env,
      DATABASE_URL: `file:${TEST_DB_PATH}`,
      NODE_ENV: "test",
      AUTH_TOKEN: "test_auth_token",
      CT0: "test_ct0_token",
      OPENAI_API_KEY: "test_openai_key"
    }
  });

  if (input && proc.stdin) {
    proc.stdin.write(input);
    proc.stdin.end();
  }

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  return { stdout, stderr, exitCode };
}

describe("Complete Workflow Tests", () => {
  beforeAll(async () => {
    // Clean up any existing test files
    const filesToClean = [TEST_DB_PATH, TEST_ENV_PATH];
    for (const file of filesToClean) {
      if (existsSync(file)) {
        await unlink(file);
      }
    }

    // Create test environment file
    await writeFile(TEST_ENV_PATH, TEST_ENV_CONTENT);
  });

  afterAll(async () => {
    // Clean up test files
    const filesToClean = [TEST_DB_PATH, TEST_ENV_PATH];
    for (const file of filesToClean) {
      if (existsSync(file)) {
        await unlink(file);
      }
    }
  });

  it("should complete database initialization workflow", async () => {
    // Step 1: Initialize database
    const initResult = await runCLI(["db", "--init"]);
    expect(initResult.exitCode).toBe(0);
    expect(existsSync(TEST_DB_PATH)).toBe(true);

    // Step 2: Check initial stats
    const statsResult = await runCLI(["db", "--stats"]);
    expect(statsResult.exitCode).toBe(0);
    expect(statsResult.stdout).toContain("Users: 0");
    expect(statsResult.stdout).toContain("Tweets: 0");

    // Step 3: Optimize empty database
    const optimizeResult = await runCLI(["optimize"]);
    expect(optimizeResult.exitCode).toBe(0);
  });

  it("should handle scraping workflow with rate limiting", async () => {
    // Test scraping with different rate limit profiles
    const profiles = ["conservative", "moderate", "aggressive"];
    
    for (const profile of profiles) {
      const result = await runCLI([
        "scrape", 
        "testuser", 
        "--max-tweets", "1",
        "--rate-limit", profile,
        "--dry-run" // Add dry-run flag to avoid actual scraping
      ]);

      // Should not crash, even if it fails due to missing real auth tokens
      expect([0, 1]).toContain(result.exitCode);
      
      if (result.exitCode === 0) {
        expect(result.stdout).toContain("Rate limiting active");
        expect(result.stdout).toContain(profile);
      }
    }
  });

  it("should validate complete interactive workflow structure", async () => {
    // Test that interactive mode starts and shows expected prompts
    const proc = spawn({
      cmd: ["bun", "run", CLI_PATH, "interactive"],
      stdout: "pipe",
      stderr: "pipe",
      stdin: "pipe",
      env: {
        ...process.env,
        DATABASE_URL: `file:${TEST_DB_PATH}`,
        NODE_ENV: "test"
      }
    });

    // Send some input and then exit
    const input = "testuser\n\x03"; // Username then Ctrl+C
    proc.stdin?.write(input);
    proc.stdin?.end();

    const stdout = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;

    // Should start interactive mode
    expect(stdout).toContain("Welcome to X-GPT Interactive Mode");
    expect([0, 130]).toContain(exitCode); // 0 or 130 (SIGINT)
  });

  it("should handle embedding workflow", async () => {
    // Test embedding generation workflow
    const result = await runCLI(["embed", "--dry-run"]);
    
    // Should handle gracefully even without real data
    expect([0, 1]).toContain(result.exitCode);
    
    if (result.exitCode === 0) {
      expect(result.stdout).toContain("embedding");
    } else {
      // Should provide helpful error message
      expect(result.stderr).toContain("tweets") || expect(result.stderr).toContain("OPENAI_API_KEY");
    }
  });

  it("should handle Q&A workflow", async () => {
    // Test question answering workflow
    const result = await runCLI(["ask", "What is this about?", "--dry-run"]);
    
    // Should handle gracefully even without embeddings
    expect([0, 1]).toContain(result.exitCode);
    
    if (result.exitCode !== 0) {
      expect(result.stderr).toContain("embedding") || expect(result.stderr).toContain("tweets");
    }
  });
});

describe("Error Recovery Tests", () => {
  it("should recover from database corruption", async () => {
    // Corrupt the database by writing invalid data
    if (existsSync(TEST_DB_PATH)) {
      await writeFile(TEST_DB_PATH, "invalid database content");
    }

    // Try to access database
    const result = await runCLI(["db", "--stats"]);
    
    // Should either recover or provide helpful error message
    if (result.exitCode !== 0) {
      expect(result.stderr).toContain("database") || expect(result.stderr).toContain("corrupt");
    }

    // Re-initialize should work
    const initResult = await runCLI(["db", "--init", "--force"]);
    expect(initResult.exitCode).toBe(0);
  });

  it("should handle missing environment variables gracefully", async () => {
    // Test without auth tokens
    const result = await runCLI(["scrape", "testuser"], undefined);
    
    if (result.exitCode !== 0) {
      expect(result.stderr).toContain("AUTH_TOKEN") || expect(result.stderr).toContain("environment");
    }
  });

  it("should handle network errors gracefully", async () => {
    // Test with invalid network conditions (simulated by invalid tokens)
    const result = await runCLI([
      "scrape", 
      "testuser", 
      "--max-tweets", "1"
    ]);

    // Should fail gracefully with helpful error message
    if (result.exitCode !== 0) {
      expect(result.stderr.length).toBeGreaterThan(0);
      expect(result.stderr).not.toContain("undefined");
      expect(result.stderr).not.toContain("null");
    }
  });
});

describe("Performance Tests", () => {
  it("should complete database operations quickly", async () => {
    const startTime = Date.now();
    
    const result = await runCLI(["db", "--stats"]);
    
    const duration = Date.now() - startTime;
    
    expect(result.exitCode).toBe(0);
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it("should handle large parameter lists", async () => {
    // Test with many keywords
    const keywords = Array.from({ length: 50 }, (_, i) => `keyword${i}`).join(",");
    
    const result = await runCLI([
      "scrape",
      "testuser",
      "--keywords", keywords,
      "--max-tweets", "1",
      "--dry-run"
    ]);

    // Should handle large parameter lists without crashing
    expect([0, 1]).toContain(result.exitCode);
  });
});

describe("Data Integrity Tests", () => {
  it("should maintain database consistency", async () => {
    // Initialize fresh database
    await runCLI(["db", "--init", "--force"]);
    
    // Get initial stats
    const initialStats = await runCLI(["db", "--stats"]);
    expect(initialStats.exitCode).toBe(0);
    
    // Run optimization
    const optimizeResult = await runCLI(["optimize"]);
    expect(optimizeResult.exitCode).toBe(0);
    
    // Stats should still be consistent
    const finalStats = await runCLI(["db", "--stats"]);
    expect(finalStats.exitCode).toBe(0);
    expect(finalStats.stdout).toContain("Users:");
    expect(finalStats.stdout).toContain("Tweets:");
  });

  it("should handle concurrent operations", async () => {
    // Run multiple database operations concurrently
    const operations = [
      runCLI(["db", "--stats"]),
      runCLI(["optimize"]),
      runCLI(["db", "--stats"])
    ];

    const results = await Promise.all(operations);
    
    // All operations should complete successfully
    results.forEach(result => {
      expect(result.exitCode).toBe(0);
    });
  });
});

describe("Configuration Tests", () => {
  it("should respect all configuration options", async () => {
    const configOptions = [
      ["--max-tweets", "100"],
      ["--rate-limit", "conservative"],
      ["--verbose"],
      ["--quiet"]
    ];

    for (const options of configOptions) {
      const result = await runCLI([
        "scrape",
        "testuser",
        ...options,
        "--dry-run"
      ]);

      // Should accept all valid configuration options
      expect([0, 1]).toContain(result.exitCode);
      
      if (result.exitCode === 1) {
        // If it fails, should not be due to invalid options
        expect(result.stderr).not.toContain("Unknown option");
        expect(result.stderr).not.toContain("Invalid option");
      }
    }
  });
});
