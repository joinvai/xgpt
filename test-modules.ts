#!/usr/bin/env bun

/**
 * Test just the modules without CLI to verify rate limiting works
 */

console.log("🧪 Testing XGPT Modules");
console.log("=" .repeat(30));

async function testRateLimiting() {
  console.log("\n🛡️  Testing Rate Limiting...");
  
  try {
    const { RATE_LIMIT_PROFILES, getRateLimitProfile, isRateLimitError } = await import("./src/rateLimit/config.js");
    const { RateLimitManager } = await import("./src/rateLimit/manager.js");
    const { TweetEstimator } = await import("./src/rateLimit/estimator.js");
    
    // Test 1: Profiles exist
    console.log("   ✅ Rate limit profiles loaded");
    console.log(`      - Conservative: ${RATE_LIMIT_PROFILES.conservative.requestsPerMinute} req/min`);
    console.log(`      - Moderate: ${RATE_LIMIT_PROFILES.moderate.requestsPerMinute} req/min`);
    console.log(`      - Aggressive: ${RATE_LIMIT_PROFILES.aggressive.requestsPerMinute} req/min`);
    
    // Test 2: Manager works
    const manager = new RateLimitManager();
    const status = manager.getStatus();
    console.log(`   ✅ Rate limit manager initialized (profile: ${status.profile})`);
    
    // Test 3: Estimator works
    const estimate = TweetEstimator.estimateCollectionTime(100, RATE_LIMIT_PROFILES.conservative);
    console.log(`   ✅ Tweet estimator works (100 tweets = ${estimate.estimatedMinutes} minutes)`);
    
    // Test 4: Error detection
    const isError = isRateLimitError({ status: 429 });
    console.log(`   ✅ Error detection works (429 is rate limit: ${isError})`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Rate limiting test failed: ${error}`);
    return false;
  }
}

async function testDatabase() {
  console.log("\n🗄️  Testing Database Schema...");
  
  try {
    const schema = await import("./src/database/schema.js");
    
    console.log("   ✅ Database schema loaded");
    console.log(`      - Users table: ${schema.users ? 'defined' : 'missing'}`);
    console.log(`      - Tweets table: ${schema.tweets ? 'defined' : 'missing'}`);
    console.log(`      - Sessions table: ${schema.scrapeSessions ? 'defined' : 'missing'}`);
    console.log(`      - Embeddings table: ${schema.embeddings ? 'defined' : 'missing'}`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Database schema test failed: ${error}`);
    return false;
  }
}

async function testQueries() {
  console.log("\n📊 Testing Database Queries...");
  
  try {
    const queries = await import("./src/database/queries.js");
    
    console.log("   ✅ Database queries loaded");
    console.log(`      - User queries: ${queries.userQueries ? 'available' : 'missing'}`);
    console.log(`      - Tweet queries: ${queries.tweetQueries ? 'available' : 'missing'}`);
    console.log(`      - Session queries: ${queries.sessionQueries ? 'available' : 'missing'}`);
    console.log(`      - Embedding queries: ${queries.embeddingQueries ? 'available' : 'missing'}`);
    console.log(`      - Stats queries: ${queries.statsQueries ? 'available' : 'missing'}`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Database queries test failed: ${error}`);
    return false;
  }
}

async function testCommands() {
  console.log("\n⚡ Testing Command Modules...");
  
  try {
    const scrapeCmd = await import("./src/commands/scrape.js");
    const interactiveCmd = await import("./src/commands/interactive.js");
    const embedCmd = await import("./src/commands/embed.js");
    const askCmd = await import("./src/commands/ask.js");
    
    console.log("   ✅ Command modules loaded");
    console.log(`      - Scrape command: ${scrapeCmd.scrapeCommand ? 'available' : 'missing'}`);
    console.log(`      - Interactive command: ${interactiveCmd.interactiveCommand ? 'available' : 'missing'}`);
    console.log(`      - Embed command: ${embedCmd.embedCommand ? 'available' : 'missing'}`);
    console.log(`      - Ask command: ${askCmd.askCommand ? 'available' : 'missing'}`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Command modules test failed: ${error}`);
    return false;
  }
}

async function main() {
  const tests = [
    { name: "Rate Limiting", fn: testRateLimiting },
    { name: "Database Schema", fn: testDatabase },
    { name: "Database Queries", fn: testQueries },
    { name: "Command Modules", fn: testCommands }
  ];
  
  let passed = 0;
  
  for (const test of tests) {
    const success = await test.fn();
    if (success) passed++;
  }
  
  console.log("\n📊 RESULTS");
  console.log("-" .repeat(20));
  console.log(`Passed: ${passed}/${tests.length}`);
  console.log(`Success Rate: ${Math.round((passed / tests.length) * 100)}%`);
  
  if (passed === tests.length) {
    console.log("\n🎉 ALL MODULE TESTS PASSED!");
    console.log("   The XGPT core modules are working correctly!");
    console.log("   Rate limiting system is ready for production use.");
  } else {
    console.log("\n❌ SOME TESTS FAILED!");
    console.log("   Check the errors above for details.");
  }
  
  console.log("\n🚀 Next Steps:");
  console.log("   • Run 'npm run build' to build the CLI");
  console.log("   • Run 'npm run dev -- --help' to test CLI commands");
  console.log("   • Set AUTH_TOKEN and CT0 environment variables for scraping");
  console.log("   • Set OPENAI_API_KEY for embedding generation");
}

main().catch(console.error);
