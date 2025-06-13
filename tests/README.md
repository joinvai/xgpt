# XGPT CLI Test Suite

Comprehensive testing for the XGPT CLI tool to ensure production reliability and functionality.

## 🧪 Test Structure

### Test Types

1. **Smoke Tests** (`smoke.test.ts`)
   - Quick verification that the app works
   - Basic functionality checks
   - Performance validation
   - Should run in under 30 seconds

2. **Unit Tests** (`unit/`)
   - Core functionality testing
   - Rate limiting system
   - Database operations
   - Utility functions

3. **Integration Tests** (`integration/`)
   - CLI command testing
   - Database integration
   - Error handling
   - Configuration validation

4. **End-to-End Tests** (`e2e/`)
   - Complete workflow testing
   - User journey validation
   - Error recovery
   - Performance testing

## 🚀 Running Tests

### Quick Test (Recommended)
```bash
npm run test:quick
```
Runs smoke tests and unit tests - fastest way to verify the app works.

### Full Test Suite
```bash
npm test
# or
npm run test:all
```
Runs all tests with comprehensive reporting.

### Individual Test Suites
```bash
# Smoke tests only (30 seconds)
npm run test:smoke

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests only
npm run test:e2e
```

### Development Testing
```bash
# Watch mode for development
npm run test:watch

# Coverage reporting
npm run test:coverage

# CI-friendly testing
npm run test:ci
```

## 📊 Test Output

### Success Example
```
🧪 XGPT CLI Test Suite
==================================================

🔍 Checking prerequisites...
   Building CLI...
   ✅ Build successful
   Testing CLI execution...
   ✅ CLI execution successful
   Auth tokens: ⚠️  Missing (some tests may be skipped)
   OpenAI API key: ⚠️  Missing (embedding tests may be skipped)

🧪 Running Unit Tests...
   Core functionality and rate limiting tests
   ✅ Unit Tests passed (25 tests, 1250ms)

🧪 Running Integration Tests...
   CLI command integration tests
   ✅ Integration Tests passed (18 tests, 2100ms)

🧪 Running End-to-End Tests...
   Complete workflow tests
   ✅ End-to-End Tests passed (12 tests, 3500ms)

📊 TEST RESULTS SUMMARY
==================================================

✅ PASS Unit Tests
     Tests: 25 passed, 0 failed (100.0%)
     Duration: 1250ms

✅ PASS Integration Tests
     Tests: 18 passed, 0 failed (100.0%)
     Duration: 2100ms

✅ PASS End-to-End Tests
     Tests: 12 passed, 0 failed (100.0%)
     Duration: 3500ms

📈 OVERALL SUMMARY
------------------------------
Total Tests: 55
Passed: 55
Failed: 0
Success Rate: 100.0%
Total Duration: 6850ms

🎉 ALL TESTS PASSED!
   The XGPT CLI is working perfectly!

📄 Detailed report saved to test-results.json
```

## 🔧 Test Configuration

### Environment Variables

Tests use these environment variables:

```bash
# Required for scraping tests (optional - tests will skip if missing)
AUTH_TOKEN=your_twitter_auth_token
CT0=your_twitter_ct0_token

# Required for embedding tests (optional - tests will skip if missing)  
OPENAI_API_KEY=your_openai_api_key

# Test database (automatically set)
DATABASE_URL=file:./test_tweets.db
NODE_ENV=test
```

### Test Database

Tests use separate databases to avoid affecting your data:
- `test_tweets.db` - Unit and integration tests
- `test_e2e_tweets.db` - End-to-end tests
- `test_integration_tweets.db` - Integration tests

These are automatically created and cleaned up.

## 🎯 What Tests Verify

### Core Functionality ✅
- CLI starts and shows help
- All commands are available
- Database operations work
- Rate limiting is functional
- Error handling is graceful

### Rate Limiting System ✅
- Token bucket algorithm works
- Exponential backoff functions
- Circuit breaker activates
- Profile selection works
- Time estimation is accurate

### User Experience ✅
- Interactive mode starts
- Configuration validation works
- Progress indicators function
- Error messages are helpful
- Performance is acceptable

### Production Readiness ✅
- No crashes on invalid input
- Graceful handling of missing auth
- Database consistency maintained
- Memory usage is reasonable
- Response times are fast

## 🚨 Troubleshooting

### Common Issues

**Tests fail with "AUTH_TOKEN" error:**
- This is expected if you haven't set up Twitter auth tokens
- Tests will skip scraping functionality but verify everything else
- Set `AUTH_TOKEN` and `CT0` environment variables to enable full testing

**Tests fail with "OPENAI_API_KEY" error:**
- This is expected if you haven't set up OpenAI API key
- Tests will skip embedding functionality but verify everything else
- Set `OPENAI_API_KEY` environment variable to enable embedding tests

**Database errors:**
- Tests automatically clean up databases
- If issues persist, manually delete `test_*.db` files
- Run `npm run test:smoke` to verify basic functionality

**Performance issues:**
- Tests have timeouts to prevent hanging
- Slow tests may indicate performance problems
- Check system resources and network connectivity

### Debug Mode

For detailed debugging:

```bash
# Run with verbose output
DEBUG=1 npm test

# Run specific test file
bun test tests/unit/rateLimit.test.ts

# Run with coverage
npm run test:coverage
```

## 📈 Continuous Integration

For CI environments:

```bash
# CI-optimized test run
npm run test:ci
```

This runs:
1. Smoke tests (quick verification)
2. Unit tests (core functionality)
3. Integration tests (CLI commands)

Skips end-to-end tests that may require real auth tokens.

## 🎉 Success Criteria

Tests pass when:
- ✅ CLI builds successfully
- ✅ CLI starts and shows help
- ✅ All core commands are available
- ✅ Rate limiting system works
- ✅ Database operations function
- ✅ Error handling is graceful
- ✅ Performance is acceptable

The test suite ensures the XGPT CLI is production-ready and safe for users to use with their auth tokens.
