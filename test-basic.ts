#!/usr/bin/env bun

/**
 * Basic functionality test - verifies the app works without hanging
 */

import { spawn } from "bun";

async function runTest(name: string, command: string[]): Promise<boolean> {
  console.log(`🧪 Testing: ${name}`);
  
  try {
    const proc = spawn({
      cmd: command,
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
    }, 5000);

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    clearTimeout(timeoutId);

    if (exitCode === 0) {
      console.log(`   ✅ ${name} - PASSED`);
      return true;
    } else {
      console.log(`   ❌ ${name} - FAILED (exit code: ${exitCode})`);
      if (stderr) console.log(`      Error: ${stderr.slice(0, 100)}...`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ${name} - ERROR: ${error}`);
    return false;
  }
}

async function testRateLimiting(): Promise<boolean> {
  console.log(`🧪 Testing: Rate Limiting Modules`);
  
  try {
    // Test rate limiting imports
    const { RATE_LIMIT_PROFILES } = await import("./src/rateLimit/config.js");
    const { RateLimitManager } = await import("./src/rateLimit/manager.js");
    const { TweetEstimator } = await import("./src/rateLimit/estimator.js");
    
    // Test basic functionality
    const manager = new RateLimitManager();
    const status = manager.getStatus();
    
    const estimate = TweetEstimator.estimateCollectionTime(100, RATE_LIMIT_PROFILES.conservative!);
    
    if (status.profile && estimate.estimatedMinutes > 0) {
      console.log(`   ✅ Rate Limiting Modules - PASSED`);
      return true;
    } else {
      console.log(`   ❌ Rate Limiting Modules - FAILED (invalid data)`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Rate Limiting Modules - ERROR: ${error}`);
    return false;
  }
}

async function testDatabase(): Promise<boolean> {
  console.log(`🧪 Testing: Database Modules`);
  
  try {
    // Test database imports
    const schema = await import("./src/database/schema.js");
    const queries = await import("./src/database/queries.js");
    
    if (schema.users && schema.tweets && queries.userQueries && queries.tweetQueries) {
      console.log(`   ✅ Database Modules - PASSED`);
      return true;
    } else {
      console.log(`   ❌ Database Modules - FAILED (missing exports)`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Database Modules - ERROR: ${error}`);
    return false;
  }
}

async function main() {
  console.log("🚀 XGPT CLI Basic Test Suite");
  console.log("=" .repeat(40));
  console.log();

  const tests = [
    // CLI tests
    { name: "CLI Help", command: ["bun", "run", "src/cli.ts", "--help"] },
    { name: "CLI Version", command: ["bun", "run", "src/cli.ts", "--version"] },
    { name: "Database Stats", command: ["bun", "run", "src/cli.ts", "db", "--stats"] },
    { name: "Scrape Help", command: ["bun", "run", "src/cli.ts", "scrape", "--help"] },
    { name: "Build", command: ["bun", "build", "src/cli.ts", "--outdir", "./dist", "--target", "bun"] }
  ];

  let passed = 0;
  let total = tests.length + 2; // +2 for module tests

  // Run CLI tests
  for (const test of tests) {
    const success = await runTest(test.name, test.command);
    if (success) passed++;
  }

  // Run module tests
  if (await testRateLimiting()) passed++;
  if (await testDatabase()) passed++;

  console.log();
  console.log("📊 RESULTS");
  console.log("-" .repeat(20));
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);
  console.log();

  if (passed === total) {
    console.log("🎉 ALL TESTS PASSED!");
    console.log("   The XGPT CLI basic functionality is working!");
  } else if (passed >= total * 0.8) {
    console.log("✅ MOST TESTS PASSED!");
    console.log("   The XGPT CLI core functionality is working.");
  } else {
    console.log("❌ TESTS FAILED!");
    console.log("   Critical issues found in basic functionality.");
  }

  process.exit(passed === total ? 0 : 1);
}

main().catch(console.error);
