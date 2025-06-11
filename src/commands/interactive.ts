import { input, confirm } from '@inquirer/prompts';
import { promptContentType, getContentTypeFilters } from '../prompts/contentType.js';
import { promptSearchScope } from '../prompts/searchScope.js';
import { promptTimeRange } from '../prompts/timeRange.js';
import { scrapeCommand } from './scrape.js';
import { embedCommand } from './embed.js';
import type { SessionConfig, PromptSession } from '../types/session.js';
import type { CommandResult } from '../types/common.js';
import { calculateDateRange, formatDateRange, getRelativeTimeDescription } from '../utils/dateUtils.js';

export async function interactiveCommand(username?: string): Promise<CommandResult> {
  try {
    console.log('\n🚀 Welcome to X-GPT Interactive Mode!');
    console.log('Let\'s configure your tweet scraping session step by step.\n');

    // Initialize session
    const session: PromptSession = {
      config: {},
      step: 'content-type',
      startTime: new Date(),
      username
    };

    // Step 1: Get username if not provided
    if (!username) {
      console.log('👤 User Selection');
      session.username = await input({
        message: 'Enter the Twitter/X username to scrape (without @):',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Please enter a username';
          }
          if (input.startsWith('@')) {
            return 'Please enter username without the @ symbol';
          }
          if (!/^[a-zA-Z0-9_]+$/.test(input)) {
            return 'Username can only contain letters, numbers, and underscores';
          }
          return true;
        }
      });
      console.log(`\n✅ Target user: @${session.username}\n`);
    }

    // Step 2: Content type selection
    session.step = 'content-type';
    session.config.contentType = await promptContentType();

    // Step 3: Search scope selection
    session.step = 'search-scope';
    const scopeResult = await promptSearchScope();
    session.config.searchScope = scopeResult.searchScope;
    session.config.keywords = scopeResult.keywords;

    // Step 4: Time range selection
    session.step = 'time-range';
    const timeResult = await promptTimeRange();
    session.config.timeRange = timeResult.timeRange;
    session.config.customDateRange = timeResult.customDateRange;

    // Step 5: Additional options
    console.log('\n⚙️  Additional Options');

    const maxTweets = await input({
      message: 'Maximum number of tweets to scrape:',
      default: '10000',
      validate: (input: string) => {
        const num = parseInt(input);
        if (isNaN(num) || num <= 0) {
          return 'Please enter a positive number';
        }
        if (num > 50000) {
          return 'Maximum limit is 50,000 tweets';
        }
        return true;
      }
    });

    const generateEmbeddings = await confirm({
      message: 'Generate embeddings after scraping? (Required for Q&A)',
      default: true
    });

    session.config.maxTweets = parseInt(maxTweets);
    session.config.generateEmbeddings = generateEmbeddings;

    // Step 6: Configuration summary and confirmation
    session.step = 'confirmation';
    await showConfigurationSummary(session);

    const confirmed = await confirm({
      message: 'Start scraping with this configuration?',
      default: true
    });

    if (!confirmed) {
      console.log('\n❌ Operation cancelled by user');
      return {
        success: false,
        message: 'Operation cancelled',
        error: 'User chose not to proceed'
      };
    }

    // Step 7: Execute scraping
    session.step = 'processing';
    console.log('\n🚀 Starting scraping process...\n');

    const result = await executeScraping(session);
    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('\n❌ Interactive session failed:', errorMessage);

    return {
      success: false,
      message: 'Interactive session failed',
      error: errorMessage
    };
  }
}

async function showConfigurationSummary(session: PromptSession): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('📋 CONFIGURATION SUMMARY');
  console.log('='.repeat(60));

  console.log(`👤 User: @${session.username}`);
  console.log(`📝 Content: ${getContentTypeDescription(session.config.contentType!)}`);
  console.log(`🔍 Scope: ${getScopeDescription(session.config)}`);
  console.log(`📅 Time: ${getTimeDescription(session.config)}`);
  console.log(`📊 Limit: ${session.config.maxTweets?.toLocaleString()} tweets max`);
  console.log(`🧠 Embeddings: ${session.config.generateEmbeddings ? 'Yes' : 'No'}`);

  console.log('='.repeat(60));
}

async function executeScraping(session: PromptSession): Promise<CommandResult> {
  const config = session.config;
  const filters = getContentTypeFilters(config.contentType!);

  // Calculate date range for filtering
  let dateRange: { start: Date; end: Date } | undefined;
  if (config.timeRange !== 'lifetime') {
    dateRange = config.timeRange === 'custom'
      ? config.customDateRange!
      : calculateDateRange(config.timeRange!);
  }

  // Execute scraping
  const scrapeResult = await scrapeCommand({
    username: session.username!,
    includeReplies: filters.includeReplies,
    includeRetweets: filters.includeRetweets,
    maxTweets: config.maxTweets!,
    keywords: config.keywords,
    dateRange
  });

  if (!scrapeResult.success) {
    return scrapeResult;
  }

  // Generate embeddings if requested
  if (config.generateEmbeddings) {
    console.log('\n🧠 Generating embeddings...');
    const embedResult = await embedCommand();

    if (!embedResult.success) {
      console.log('\n⚠️  Scraping completed but embedding generation failed');
      console.log('You can generate embeddings later with: xgpt embed');
    } else {
      console.log('\n✅ Embeddings generated successfully!');
    }
  }

  console.log('\n🎉 Interactive session completed successfully!');
  console.log('\nNext steps:');
  console.log('• Ask questions: xgpt ask "What does this person think about AI?"');
  console.log('• View scraped data: cat tweets.json');
  if (config.generateEmbeddings) {
    console.log('• View embeddings: cat vectors.json');
  }

  return {
    success: true,
    message: 'Interactive session completed successfully',
    data: {
      session: session.config,
      scrapeResult: scrapeResult.data
    }
  };
}

function getContentTypeDescription(contentType: SessionConfig['contentType']): string {
  switch (contentType) {
    case 'tweets': return 'Tweets only';
    case 'replies': return 'Replies only';
    case 'both': return 'Tweets and replies';
    default: return 'Unknown';
  }
}

function getScopeDescription(config: Partial<SessionConfig>): string {
  if (config.searchScope === 'keywords' && config.keywords) {
    return `Keywords: ${config.keywords.join(', ')}`;
  }
  return 'All posts';
}

function getTimeDescription(config: Partial<SessionConfig>): string {
  if (config.timeRange === 'custom' && config.customDateRange) {
    return formatDateRange(config.customDateRange.start, config.customDateRange.end);
  }
  return getRelativeTimeDescription(config.timeRange!);
}
