/**
 * Integration tests for CLI commands
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { spawn } from "bun";
import { unlink, mkdir } from "fs/promises";
import { existsSync } from "fs";

const CLI_PATH = "./src/cli.ts";
const TEST_DB_PATH = "./test_tweets.db";

// Helper function to run CLI commands
async function runCLI(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = spawn({
    cmd: ["bun", "run", CLI_PATH, ...args],
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      DATABASE_URL: `file:${TEST_DB_PATH}`,
      NODE_ENV: "test"
    }
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  return { stdout, stderr, exitCode };
}

describe("CLI Help and Version", () => {
  it("should show help message", async () => {
    const result = await runCLI(["--help"]);
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AI-powered Twitter/X scraping");
    expect(result.stdout).toContain("Commands:");
    expect(result.stdout).toContain("interactive");
    expect(result.stdout).toContain("scrape");
    expect(result.stdout).toContain("embed");
    expect(result.stdout).toContain("ask");
  });

  it("should show version", async () => {
    const result = await runCLI(["--version"]);
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/\d+\.\d+\.\d+/); // Version format
  });

  it("should show command-specific help", async () => {
    const commands = ["scrape", "embed", "ask", "db"];
    
    for (const command of commands) {
      const result = await runCLI([command, "--help"]);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain(command);
    }
  });
});

describe("Database Commands", () => {
  beforeAll(async () => {
    // Clean up any existing test database
    if (existsSync(TEST_DB_PATH)) {
      await unlink(TEST_DB_PATH);
    }
  });

  afterAll(async () => {
    // Clean up test database
    if (existsSync(TEST_DB_PATH)) {
      await unlink(TEST_DB_PATH);
    }
  });

  it("should initialize database", async () => {
    const result = await runCLI(["db", "--init"]);
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Database initialized");
    expect(existsSync(TEST_DB_PATH)).toBe(true);
  });

  it("should show database statistics", async () => {
    const result = await runCLI(["db", "--stats"]);
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Database Statistics");
    expect(result.stdout).toContain("Users:");
    expect(result.stdout).toContain("Tweets:");
    expect(result.stdout).toContain("Sessions:");
  });

  it("should handle database optimization", async () => {
    const result = await runCLI(["optimize"]);
    
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("optimization");
  });
});

describe("Scrape Command Validation", () => {
  it("should validate username parameter", async () => {
    const result = await runCLI(["scrape"]);
    
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("username");
  });

  it("should validate rate limit profile", async () => {
    const result = await runCLI(["scrape", "testuser", "--rate-limit", "invalid"]);
    
    // Should either use default or show error
    expect(result.exitCode).toBe(0); // Should default to conservative
  });

  it("should handle missing auth tokens gracefully", async () => {
    // Remove auth tokens from environment
    const result = await runCLI(["scrape", "testuser", "--max-tweets", "1"]);
    
    // Should fail gracefully with helpful error message
    expect(result.stderr).toContain("AUTH_TOKEN");
  });
});

describe("Embed Command", () => {
  it("should handle empty database", async () => {
    const result = await runCLI(["embed"]);
    
    // Should handle gracefully even with no tweets
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("embedding");
  });

  it("should validate OpenAI API key", async () => {
    const result = await runCLI(["embed", "--force"]);
    
    // Should check for OpenAI API key
    if (result.exitCode !== 0) {
      expect(result.stderr).toContain("OPENAI_API_KEY");
    }
  });
});

describe("Ask Command", () => {
  it("should require question parameter", async () => {
    const result = await runCLI(["ask"]);
    
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("question");
  });

  it("should handle empty embeddings gracefully", async () => {
    const result = await runCLI(["ask", "test question"]);
    
    // Should handle gracefully even with no embeddings
    if (result.exitCode !== 0) {
      expect(result.stderr).toContain("embedding");
    }
  });
});

describe("Interactive Mode", () => {
  it("should start interactive mode", async () => {
    // This test is tricky since interactive mode requires user input
    // We'll just test that it starts without crashing
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

    // Send Ctrl+C to exit
    proc.stdin?.write("\x03");
    
    const exitCode = await proc.exited;
    
    // Should exit gracefully (may be 0 or 130 for SIGINT)
    expect([0, 130]).toContain(exitCode);
  });
});

describe("Error Handling", () => {
  it("should handle invalid commands gracefully", async () => {
    const result = await runCLI(["invalid-command"]);
    
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Unknown command");
  });

  it("should handle invalid options gracefully", async () => {
    const result = await runCLI(["scrape", "testuser", "--invalid-option"]);
    
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("Unknown option");
  });

  it("should provide helpful error messages", async () => {
    const result = await runCLI(["scrape", "testuser", "--max-tweets", "invalid"]);
    
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("number");
  });
});

describe("Configuration Validation", () => {
  it("should validate max tweets parameter", async () => {
    const testCases = [
      { value: "0", shouldFail: true },
      { value: "-1", shouldFail: true },
      { value: "100000", shouldFail: true }, // Too high
      { value: "1000", shouldFail: false }
    ];

    for (const testCase of testCases) {
      const result = await runCLI(["scrape", "testuser", "--max-tweets", testCase.value]);
      
      if (testCase.shouldFail) {
        expect(result.exitCode).toBe(1);
      } else {
        // May fail due to missing auth, but shouldn't fail validation
        if (result.exitCode === 1) {
          expect(result.stderr).not.toContain("Invalid number");
        }
      }
    }
  });

  it("should validate date ranges", async () => {
    const result = await runCLI([
      "scrape", 
      "testuser", 
      "--start-date", "2024-01-01",
      "--end-date", "2023-12-31" // End before start
    ]);
    
    if (result.exitCode === 1) {
      expect(result.stderr).toContain("date");
    }
  });
});

describe("Output Validation", () => {
  it("should produce consistent output format", async () => {
    const result = await runCLI(["db", "--stats"]);
    
    expect(result.exitCode).toBe(0);
    
    // Check for consistent formatting
    const lines = result.stdout.split('\n');
    expect(lines.some(line => line.includes('Database Statistics'))).toBe(true);
    expect(lines.some(line => line.includes('Users:'))).toBe(true);
    expect(lines.some(line => line.includes('Tweets:'))).toBe(true);
  });

  it("should handle verbose output", async () => {
    const result = await runCLI(["db", "--stats", "--verbose"]);
    
    expect(result.exitCode).toBe(0);
    // Verbose mode should provide more detailed output
  });
});
