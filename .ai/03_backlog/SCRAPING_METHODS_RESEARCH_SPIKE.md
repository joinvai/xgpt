# Research Spike: Two Scraping Methods for XGPT

## Executive Summary

**Research Question**: What's the level of effort to implement two scraping methods?
1. **Current Method**: Auth token-based scraping (existing)
2. **Alternative Method**: Headless browser automation with Playwright

**Key Findings**:
- **Current method** needs rate limiting (1-2 days effort)
- **Playwright method** is significantly more complex (1-2 weeks effort)
- **Hybrid approach** may be optimal for production use

## Method 1: Current Auth Token Approach

### Current Implementation
- Uses `@the-convocation/twitter-scraper` library
- Requires user's AUTH_TOKEN and CT0 cookies
- Direct API-like requests to Twitter's backend

### Pros
✅ **Fast and efficient** - Direct API calls  
✅ **Already implemented** - Working end-to-end  
✅ **Reliable data structure** - Consistent JSON responses  
✅ **Lower resource usage** - No browser overhead  

### Cons
❌ **Requires user auth tokens** - Security/privacy concerns  
❌ **Rate limit sensitive** - Risk of account suspension  
❌ **Limited to logged-in user's access** - Can't access all public content  
❌ **Token expiration** - Requires token refresh  

### Required Effort for Production
**Timeline**: 1-2 days  
**Tasks**:
- Implement rate limiting (PERF-002)
- Add exponential backoff
- Token validation and refresh
- Safety mechanisms

## Method 2: Headless Browser Automation (Playwright)

### Research Findings from ScrapFly Article

#### Core Approach
```typescript
// Capture background XHR requests
page.on("response", (response) => {
  if (response.request.resource_type === "xhr") {
    // Filter for tweet data: "TweetResultByRestId"
    // Filter for user data: "UserBy"
    xhr_calls.push(response);
  }
});
```

#### Key Technical Details
1. **Background Request Capture**: Twitter loads data via XHR calls
2. **No Login Required**: Can scrape public tweets and profiles
3. **Wait Selectors**: Must wait for `[data-testid='tweet']` to load
4. **JSON Parsing**: Complex nested data structures need parsing

### Playwright Implementation Analysis

#### For Individual Tweets
```typescript
// Load tweet page and capture background requests
await page.goto(tweetUrl);
await page.waitForSelector("[data-testid='tweet']");
// Extract from XHR calls containing "TweetResultByRestId"
```

#### For User Profiles  
```typescript
// Load profile page and capture background requests
await page.goto(profileUrl);
await page.waitForSelector("[data-testid='primaryColumn']");
// Extract from XHR calls containing "UserBy"
```

#### For Search & Timeline (Complex)
**Major Challenge**: Search and timelines require login for full access

**Potential Workarounds**:
1. **Mobile User Agent**: Android guest access (limited)
2. **Nitter Integration**: Open-source Twitter frontend
3. **Search Page Automation**: Type keywords, scroll, capture

### Search Automation Deep Dive

#### Technique 1: Direct Search URL
```typescript
// Navigate to search URL
await page.goto(`https://twitter.com/search?q=${encodeURIComponent(keywords)}`);
await page.waitForSelector("[data-testid='tweet']");
// Scroll to load more tweets
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
```

#### Technique 2: Search Box Automation
```typescript
// Navigate to Twitter homepage
await page.goto('https://twitter.com');
// Type in search box
await page.fill('[data-testid="SearchBox_Search_Input"]', keywords);
await page.press('[data-testid="SearchBox_Search_Input"]', 'Enter');
// Handle infinite scroll
for (let i = 0; i < scrollCount; i++) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000); // Wait for new content
}
```

#### Rate Limit Bypass Strategies
1. **Slower Scrolling**: 2-3 second delays between scrolls
2. **Random Delays**: Jitter between 1-5 seconds
3. **User Agent Rotation**: Mimic different browsers
4. **Proxy Rotation**: Different IP addresses
5. **Session Management**: Fresh browser contexts

### Implementation Effort Estimate

#### Phase 1: Basic Playwright Integration (3-4 days)
- Set up Playwright infrastructure
- Implement tweet and profile scraping
- Background request capture and parsing
- Basic error handling

#### Phase 2: Search Automation (4-5 days)
- Search page navigation and automation
- Keyword input and submission
- Infinite scroll implementation
- Content extraction from search results

#### Phase 3: Rate Limit Management (2-3 days)
- Implement scrolling delays and jitter
- User agent and proxy rotation
- Session management and cleanup
- Error detection and recovery

#### Phase 4: Data Integration (2-3 days)
- Integrate with existing database schema
- Data parsing and normalization
- Progress indicators and user feedback
- Testing and validation

**Total Effort**: 11-15 days (2-3 weeks)

## Comparison Matrix

| Aspect                  | Auth Token Method         | Playwright Method       |
| ----------------------- | ------------------------- | ----------------------- |
| **Implementation Time** | 1-2 days                  | 2-3 weeks               |
| **Reliability**         | High (with rate limiting) | Medium (blocking risk)  |
| **Data Quality**        | Excellent                 | Good                    |
| **Resource Usage**      | Low                       | High (browser overhead) |
| **User Privacy**        | Requires tokens           | No tokens needed        |
| **Rate Limits**         | Strict (user account)     | Moderate (IP-based)     |
| **Maintenance**         | Low                       | High (UI changes)       |
| **Scalability**         | Limited by tokens         | Better (multiple IPs)   |

## Hybrid Approach Recommendation

### Strategy: Dual-Method Implementation
1. **Primary**: Auth token method (current) with proper rate limiting
2. **Fallback**: Playwright method for public data when tokens unavailable
3. **User Choice**: Let users choose their preferred method

### Implementation Plan
```typescript
interface ScrapingConfig {
  method: 'auth-token' | 'playwright' | 'auto';
  authToken?: string;
  ct0?: string;
  useHeadless?: boolean;
  rateLimitProfile?: 'conservative' | 'moderate' | 'aggressive';
}
```

### Benefits
- **Flexibility**: Users can choose based on their comfort level
- **Reliability**: Fallback when one method fails
- **Privacy**: Option to avoid sharing auth tokens
- **Performance**: Use faster method when available

## Recommendations

### Immediate Priority (Next 1-2 days)
1. **Implement PERF-002 rate limiting** for current auth token method
2. **Add safety mechanisms** to protect user accounts
3. **Create production-ready** auth token scraping

### Medium-term (Next 2-4 weeks)
1. **Research Playwright integration** as proof of concept
2. **Implement basic tweet/profile scraping** with Playwright
3. **Add as alternative method** in CLI options

### Long-term (Future iterations)
1. **Full search automation** with Playwright
2. **Advanced rate limit bypass** techniques
3. **Hybrid method optimization** based on user feedback

## Risk Assessment

### Auth Token Method Risks
- **Account suspension** if rate limits exceeded
- **Token expiration** requiring user intervention
- **Limited to user's access level**

### Playwright Method Risks
- **IP blocking** from aggressive scraping
- **UI changes** breaking selectors
- **Higher resource consumption**
- **Complex error handling**

## Technical Deep Dive: Playwright Search Automation

### Advanced Search Techniques

#### Keyword-Based Search Automation
```typescript
async function searchWithKeywords(page: Page, keywords: string[], options: SearchOptions) {
  // Navigate to Twitter search
  await page.goto('https://twitter.com/search');

  // Wait for search input to be available
  await page.waitForSelector('[data-testid="SearchBox_Search_Input"]');

  for (const keyword of keywords) {
    // Clear and type new keyword
    await page.fill('[data-testid="SearchBox_Search_Input"]', keyword);
    await page.press('[data-testid="SearchBox_Search_Input"]', 'Enter');

    // Wait for results to load
    await page.waitForSelector('[data-testid="tweet"]', { timeout: 10000 });

    // Implement intelligent scrolling
    await intelligentScroll(page, options.maxTweets);

    // Extract tweets from current search
    const tweets = await extractTweetsFromPage(page);

    // Rate limiting between searches
    await randomDelay(2000, 5000);
  }
}

async function intelligentScroll(page: Page, maxTweets: number) {
  let tweetCount = 0;
  let noNewContentCount = 0;

  while (tweetCount < maxTweets && noNewContentCount < 3) {
    const beforeCount = await page.$$eval('[data-testid="tweet"]', els => els.length);

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for new content with random delay
    await randomDelay(1500, 3500);

    const afterCount = await page.$$eval('[data-testid="tweet"]', els => els.length);

    if (afterCount === beforeCount) {
      noNewContentCount++;
    } else {
      noNewContentCount = 0;
      tweetCount = afterCount;
    }
  }
}
```

#### Rate Limit Bypass Strategies
```typescript
interface RateLimitConfig {
  scrollDelay: [number, number]; // [min, max] milliseconds
  searchDelay: [number, number]; // Between keyword searches
  requestDelay: [number, number]; // Between page loads
  maxConcurrent: number; // Concurrent browser instances
  userAgents: string[]; // Rotation pool
  proxies?: string[]; // Optional proxy rotation
}

const conservativeConfig: RateLimitConfig = {
  scrollDelay: [2000, 4000],
  searchDelay: [5000, 10000],
  requestDelay: [3000, 6000],
  maxConcurrent: 1,
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
  ]
};
```

### Mobile User Agent Strategy
```typescript
// Android mobile user agent for guest access
const mobileUserAgent = 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36';

await page.setUserAgent(mobileUserAgent);
await page.setViewportSize({ width: 375, height: 812 }); // Mobile viewport
```

## Implementation Complexity Analysis

### Current Method Enhancement (PERF-002)
**Effort**: 1-2 days
**Complexity**: Low-Medium
**Files to modify**: 3-4
**New dependencies**: None

```typescript
// Simple rate limiting integration
const rateLimiter = new TokenBucket({
  capacity: 60, // requests per hour
  refillRate: 1, // 1 request per minute
});

await rateLimiter.consume(1); // Before each request
await scrapeUser(username); // Existing scraping logic
```

### Playwright Method Implementation
**Effort**: 2-3 weeks
**Complexity**: High
**Files to create**: 8-12
**New dependencies**: playwright, stealth plugins

```typescript
// Complex browser automation
const browser = await playwright.chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage']
});

const context = await browser.newContext({
  userAgent: getRandomUserAgent(),
  viewport: { width: 1920, height: 1080 },
  extraHTTPHeaders: getRandomHeaders()
});

// Stealth mode to avoid detection
await context.addInitScript(() => {
  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
});
```

### Data Structure Comparison

#### Auth Token Method (Current)
```typescript
interface TweetData {
  id: string;
  text: string;
  user: string;
  created_at: string;
  metadata: {
    isRetweet: boolean;
    isReply: boolean;
    likes: number;
    retweets: number;
  };
}
```

#### Playwright Method (XHR Capture)
```typescript
interface PlaywrightTweetData {
  tweet: {
    rest_id: string;
    legacy: {
      full_text: string;
      created_at: string;
      favorite_count: number;
      retweet_count: number;
      // ... 50+ more fields
    };
    core: {
      user_results: {
        result: {
          legacy: {
            screen_name: string;
            // ... 30+ more fields
          };
        };
      };
    };
  };
}
```

**Parsing Complexity**: Playwright method requires significant JSON transformation

## Cost-Benefit Analysis

### Development Time Investment
| Task           | Auth Token   | Playwright   |
| -------------- | ------------ | ------------ |
| Rate Limiting  | 8 hours      | 16 hours     |
| Error Handling | 4 hours      | 12 hours     |
| Data Parsing   | 2 hours      | 20 hours     |
| Testing        | 4 hours      | 16 hours     |
| Documentation  | 2 hours      | 8 hours      |
| **Total**      | **20 hours** | **72 hours** |

### Maintenance Overhead
- **Auth Token**: Low (stable API patterns)
- **Playwright**: High (UI changes, selector updates)

### Resource Requirements
- **Auth Token**: ~10MB RAM per scraping session
- **Playwright**: ~200MB RAM per browser instance

## Final Recommendation

### Phase 1: Immediate (1-2 days)
✅ **Implement PERF-002 rate limiting** for auth token method
✅ **Add production safety mechanisms**
✅ **Deploy reliable scraping solution**

### Phase 2: Research (1 week)
🔬 **Create Playwright proof-of-concept**
🔬 **Test rate limit bypass techniques**
🔬 **Evaluate data quality and reliability**

### Phase 3: Optional Enhancement (2-3 weeks)
⚡ **Implement Playwright as secondary method**
⚡ **Add user choice between methods**
⚡ **Create hybrid fallback system**

**Bottom Line**: The auth token method with proper rate limiting provides 80% of the value with 20% of the effort. Playwright is a valuable future enhancement but not critical for immediate production use.
