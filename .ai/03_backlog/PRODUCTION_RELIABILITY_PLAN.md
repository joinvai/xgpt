# Production Reliability Plan: Rate Limiting & Auth Token Protection

## 🚨 CRITICAL PRIORITY

**Status**: URGENT - Required for production use with user auth tokens  
**Timeline**: 1-2 days  
**Risk Level**: HIGH - Account suspension/bans possible without proper rate limiting

## Problem Statement

The XGPT CLI tool currently uses users' personal X/Twitter authentication tokens (AUTH_TOKEN, CT0) for scraping without proper rate limiting. This poses significant risks:

1. **Account Suspension**: Aggressive scraping can lead to user account bans
2. **Token Invalidation**: Rate limit violations can invalidate auth tokens
3. **IP Blocking**: Excessive requests can result in IP-based blocks
4. **Production Unreliability**: Unpredictable failures during scraping operations

## Research Findings: X/Twitter Rate Limits

### Official API Limits (for reference)
- **Free Tier**: 1 request/15min for user timeline
- **Basic Tier**: 5 requests/15min for user timeline  
- **Pro Tier**: 900 requests/15min for user timeline

### Cookie-Based Scraping Reality
- **More Restrictive**: Not using official API, stricter enforcement
- **Estimated Safe Limits**: 1-2 requests per minute maximum
- **Detection Patterns**: High frequency, large batches, concurrent sessions
- **Response Codes**: 429 (Too Many Requests), 503 (Service Unavailable), 401 (Unauthorized)

## Implementation Plan: PERF-002 Rate Limiting

### Phase 1: Core Infrastructure (Day 1, 4-6 hours)

#### 1.1 Rate Limiting Manager
**File**: `src/rateLimit/manager.ts`
```typescript
// Token bucket algorithm implementation
// Conservative default: 1 request per 30 seconds
// Configurable limits based on account tier detection
// Request queuing and throttling
```

#### 1.2 Configuration System
**File**: `src/rateLimit/config.ts`
```typescript
// Rate limit profiles (conservative, moderate, aggressive)
// Account tier detection and auto-adjustment
// User-configurable overrides with warnings
```

#### 1.3 Integration with Scraper
**File**: `src/commands/scrape.ts` (modifications)
```typescript
// Integrate rate limiting before each request
// Add rate limit status to progress indicators
// Handle rate limit errors gracefully
```

### Phase 2: Error Handling & Recovery (Day 1, 2-4 hours)

#### 2.1 Exponential Backoff
**File**: `src/utils/backoff.ts`
```typescript
// Start: 1 second delay
// Max: 300 seconds (5 minutes)
// Jitter: ±25% to avoid thundering herd
// Reset on successful requests
```

#### 2.2 Error Detection
**File**: `src/rateLimit/detector.ts`
```typescript
// Monitor response codes (429, 503, 401)
// Detect rate limit headers if present
// Pattern recognition for soft rate limiting
// Account health monitoring
```

### Phase 3: User Experience (Day 2, 3-4 hours)

#### 3.1 Progress Enhancement
**File**: `src/ui/rateLimitProgress.ts`
```typescript
// Rate limit aware progress bars
// ETA calculations including wait times
// Clear messaging about delays
// Option to pause/resume operations
```

#### 3.2 Tweet Collection Estimator
**File**: `src/rateLimit/estimator.ts`
```typescript
// Calculate realistic collection estimates
// Factor in rate limits and user preferences
// Provide time estimates before starting
// Warn users about long operations
```

### Phase 4: Safety & Monitoring (Day 2, 2-3 hours)

#### 4.1 Safety Mechanisms
**File**: `src/rateLimit/safety.ts`
```typescript
// Circuit breaker pattern for repeated failures
// Automatic operation suspension on errors
// User confirmation for high-risk operations
// Emergency stop functionality
```

#### 4.2 Monitoring & Logging
**File**: `src/rateLimit/monitor.ts`
```typescript
// Rate limit status tracking
// Request/response logging
// Performance metrics collection
// Health check reporting
```

## Expected Outcomes

### Immediate Benefits
1. **Account Protection**: Prevent user account suspensions
2. **Reliable Operations**: Predictable scraping behavior
3. **Better UX**: Clear progress and time estimates
4. **Error Recovery**: Graceful handling of rate limit errors

### Long-term Benefits
1. **Production Ready**: Safe for widespread use
2. **Scalable**: Handle various account tiers and limits
3. **Maintainable**: Clear monitoring and configuration
4. **Trustworthy**: Users can confidently use their tokens

## Risk Mitigation

### Conservative Defaults
- Start with 1 request per 30 seconds
- Require user confirmation for aggressive settings
- Automatic fallback to safer limits on errors

### User Education
- Clear documentation about rate limiting
- Warnings about potential risks
- Best practices for safe usage

### Monitoring & Alerts
- Real-time rate limit status
- Automatic operation suspension on repeated failures
- Clear error messages with recovery suggestions

## Success Metrics

1. **Zero Account Suspensions**: No user reports of account bans
2. **Reliable Operations**: <1% failure rate due to rate limiting
3. **Accurate Estimates**: ±10% accuracy on time predictions
4. **User Satisfaction**: Positive feedback on reliability

## Next Steps

1. **Immediate**: Begin implementation of PERF-002 rate limiting
2. **Testing**: Validate with various scraping scenarios
3. **Documentation**: Update README with safety guidelines
4. **Monitoring**: Track performance and user feedback

---

**Priority**: 🚨 CRITICAL - Must implement before any production use
**Owner**: Development team
**Timeline**: 1-2 days maximum
**Dependencies**: None (can start immediately)
