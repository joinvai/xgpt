import { Scraper } from "@the-convocation/twitter-scraper";
import "dotenv/config";
import * as cliProgress from 'cli-progress';
import type { ScrapingOptions, Tweet, CommandResult } from "../types/common.js";
import { matchesKeywords } from "../prompts/searchScope.js";
import { isWithinDateRange } from "../utils/dateUtils.js";
import { userQueries, tweetQueries, sessionQueries } from "../database/queries.js";
import type { NewTweet, NewScrapeSession } from "../database/schema.js";

export async function scrapeCommand(options: ScrapingOptions): Promise<CommandResult> {
  const {
    username,
    includeReplies = false,
    includeRetweets = false,
    maxTweets = 10000,
    keywords,
    dateRange
  } = options;

  try {

    console.log(`🐦 Starting to scrape tweets from @${username}...`);

    // Create or update user in database
    console.log(`👤 Setting up user @${username} in database...`);
    const user = await userQueries.upsertUser(username, username);
    console.log(`✅ User @${username} ready (ID: ${user.id})`);

    // Create scrape session record
    const sessionData: NewScrapeSession = {
      userId: user.id,
      username: username,
      contentType: includeReplies && includeRetweets ? 'both' : includeReplies ? 'replies' : 'tweets',
      searchScope: keywords && keywords.length > 0 ? 'keywords' : 'all',
      keywords: keywords ? JSON.stringify(keywords) : null,
      timeRange: dateRange ? 'custom' : 'lifetime',
      customDateRange: dateRange ? JSON.stringify(dateRange) : null,
      maxTweets: maxTweets,
      status: 'running'
    };

    const session = await sessionQueries.createSession(sessionData);
    console.log(`📊 Created scrape session (ID: ${session.id})`);

    // Set up cookies for authentication
    const cookies = [
      `auth_token=${process.env.AUTH_TOKEN}; Path=/; Domain=.x.com; Secure; HttpOnly`,
      `ct0=${process.env.CT0}; Path=/; Domain=.x.com; Secure`
    ];

    if (!process.env.AUTH_TOKEN || !process.env.CT0) {
      await sessionQueries.updateSessionStatus(session.id, 'failed', {
        errorMessage: 'Missing authentication tokens'
      });
      return {
        success: false,
        message: "Missing authentication tokens",
        error: "Please set AUTH_TOKEN and CT0 environment variables. See README for cookie setup instructions."
      };
    }

    const scraper = new Scraper();
    await scraper.setCookies(cookies);

    // Show active filters
    console.log(`📊 Active filters:`);
    console.log(`   • Replies: ${includeReplies ? 'included' : 'excluded'}`);
    console.log(`   • Retweets: ${includeRetweets ? 'included' : 'excluded'}`);
    if (keywords && keywords.length > 0) {
      console.log(`   • Keywords: ${keywords.join(', ')}`);
    }
    if (dateRange) {
      console.log(`   • Date range: ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`);
    }
    console.log();

    // Initialize progress tracking
    let scrapedCount = 0;
    let filteredCount = 0;
    let keywordFilteredCount = 0;
    let dateFilteredCount = 0;
    const tweets: Tweet[] = [];
    const tweetBatch: NewTweet[] = [];

    // Create progress bar
    const progressBar = new cliProgress.SingleBar({
      format: '🐦 Scraping |{bar}| {percentage}% | {value}/{total} tweets | Processed: {processed} | ETA: {eta}s',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    // Start progress bar
    progressBar.start(maxTweets, 0, {
      processed: 0
    });

    for await (const tweet of scraper.getTweets(username)) {
      scrapedCount++;

      // Apply content type filters
      if (!includeRetweets && tweet.isRetweet) {
        filteredCount++;
        continue;
      }

      if (!includeReplies && tweet.isReply) {
        filteredCount++;
        continue;
      }

      // Apply date range filter
      if (dateRange && tweet.timeParsed) {
        if (!isWithinDateRange(tweet.timeParsed, dateRange.start, dateRange.end)) {
          dateFilteredCount++;
          continue;
        }
      }

      // Apply keyword filter
      if (keywords && keywords.length > 0) {
        if (!matchesKeywords(tweet.text || '', keywords)) {
          keywordFilteredCount++;
          continue;
        }
      }

      // Process and store tweet
      const processedTweet: Tweet = {
        id: tweet.id!,
        text: (tweet.text ?? "").replace(/\s+/g, " ").trim(),
        user: username,
        created_at: tweet.timeParsed?.toISOString(),
        metadata: {
          isRetweet: tweet.isRetweet,
          isReply: tweet.isReply,
          likes: tweet.likes,
          retweets: tweet.retweets,
          replies: tweet.replies
        }
      };

      // Prepare tweet for database insertion
      const dbTweet: NewTweet = {
        id: tweet.id!,
        text: (tweet.text ?? "").replace(/\s+/g, " ").trim(),
        userId: user.id,
        username: username,
        createdAt: tweet.timeParsed || new Date(),
        isRetweet: tweet.isRetweet || false,
        isReply: tweet.isReply || false,
        likes: tweet.likes || 0,
        retweets: tweet.retweets || 0,
        replies: tweet.replies || 0,
        metadata: JSON.stringify({
          isRetweet: tweet.isRetweet,
          isReply: tweet.isReply,
          likes: tweet.likes,
          retweets: tweet.retweets,
          replies: tweet.replies
        })
      };

      tweets.push(processedTweet);
      tweetBatch.push(dbTweet);

      // Update progress bar
      progressBar.update(tweets.length, {
        processed: scrapedCount
      });

      if (tweets.length >= maxTweets) {
        progressBar.update(maxTweets, {
          processed: scrapedCount
        });
        break;
      }
    }

    // Stop progress bar
    progressBar.stop();
    console.log(`🎯 Scraping completed! Collected ${tweets.length} tweets from ${scrapedCount} processed.`);

    // Save tweets to database (handle duplicates)
    if (tweetBatch.length > 0) {
      console.log(`💾 Saving ${tweetBatch.length} tweets to database...`);
      let savedCount = 0;
      let duplicateCount = 0;

      // Insert tweets one by one to handle duplicates gracefully
      for (const tweet of tweetBatch) {
        try {
          // Check if tweet already exists
          const existingTweet = await tweetQueries.tweetExists(tweet.id);
          if (existingTweet) {
            duplicateCount++;
            continue;
          }

          // Insert new tweet
          await tweetQueries.insertTweets([tweet]);
          savedCount++;
        } catch (error) {
          // If it's a duplicate constraint error, count as duplicate
          if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
            duplicateCount++;
          } else {
            console.error(`❌ Failed to save tweet ${tweet.id}:`, error);
          }
        }
      }

      console.log(`✅ Successfully saved ${savedCount} new tweets to database`);
      if (duplicateCount > 0) {
        console.log(`ℹ️  Skipped ${duplicateCount} duplicate tweets`);
      }
    }

    // Update session with final results
    await sessionQueries.updateSessionStatus(session.id, 'completed', {
      tweetsCollected: tweets.length,
      totalProcessed: scrapedCount,
      contentFiltered: filteredCount,
      keywordFiltered: keywordFilteredCount,
      dateFiltered: dateFilteredCount
    });

    const totalFiltered = filteredCount + keywordFilteredCount + dateFilteredCount;
    const message = `✅ Successfully scraped ${tweets.length} tweets from @${username}`;
    console.log(message);
    console.log(`💾 Saved to SQLite database`);
    console.log(`📊 Statistics:`);
    console.log(`   • Total processed: ${scrapedCount}`);
    console.log(`   • Content filtered: ${filteredCount}`);
    if (keywordFilteredCount > 0) {
      console.log(`   • Keyword filtered: ${keywordFilteredCount}`);
    }
    if (dateFilteredCount > 0) {
      console.log(`   • Date filtered: ${dateFilteredCount}`);
    }
    console.log(`   • Total filtered: ${totalFiltered}`);
    console.log(`   • Final collected: ${tweets.length}`);

    return {
      success: true,
      message,
      data: {
        tweetsCollected: tweets.length,
        totalProcessed: scrapedCount,
        contentFiltered: filteredCount,
        keywordFiltered: keywordFilteredCount,
        dateFiltered: dateFilteredCount,
        totalFiltered,
        sessionId: session.id,
        userId: user.id
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("❌ Scraping failed:", errorMessage);

    // Update session status if session was created
    try {
      // Try to find the session by username and update it
      const sessions = await sessionQueries.getSessionsByUser(username);
      const runningSession = sessions.find(s => s.status === 'running');
      if (runningSession) {
        await sessionQueries.updateSessionStatus(runningSession.id, 'failed', {
          errorMessage: errorMessage
        });
      }
    } catch (sessionError) {
      console.error("❌ Failed to update session status:", sessionError);
    }

    return {
      success: false,
      message: "Scraping failed",
      error: errorMessage
    };
  }
}

// Legacy function for backward compatibility
export async function scrapeUser(username: string): Promise<CommandResult> {
  return scrapeCommand({ username });
}
