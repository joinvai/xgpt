import { Scraper } from "@the-convocation/twitter-scraper";
import { writeFile } from "fs/promises";
import "dotenv/config";
import * as cliProgress from 'cli-progress';
import type { ScrapingOptions, Tweet, CommandResult } from "../types/common.js";
import { matchesKeywords } from "../prompts/searchScope.js";
import { isWithinDateRange } from "../utils/dateUtils.js";

export async function scrapeCommand(options: ScrapingOptions): Promise<CommandResult> {
  try {
    const {
      username,
      includeReplies = false,
      includeRetweets = false,
      maxTweets = 10000,
      keywords,
      dateRange
    } = options;

    console.log(`🐦 Starting to scrape tweets from @${username}...`);

    // Set up cookies for authentication
    const cookies = [
      `auth_token=${process.env.AUTH_TOKEN}; Path=/; Domain=.x.com; Secure; HttpOnly`,
      `ct0=${process.env.CT0}; Path=/; Domain=.x.com; Secure`
    ];

    if (!process.env.AUTH_TOKEN || !process.env.CT0) {
      return {
        success: false,
        message: "Missing authentication tokens",
        error: "Please set AUTH_TOKEN and CT0 environment variables. See README for cookie setup instructions."
      };
    }

    const scraper = new Scraper();
    await scraper.setCookies(cookies);

    const tweets: Tweet[] = [];
    let scrapedCount = 0;
    let filteredCount = 0;
    let keywordFilteredCount = 0;
    let dateFilteredCount = 0;

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

      tweets.push(processedTweet);

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

    // Save to JSON file (will be replaced with SQLite in CLI-003)
    const outputFile = "tweets.json";
    await writeFile(outputFile, JSON.stringify(tweets, null, 2));

    const totalFiltered = filteredCount + keywordFilteredCount + dateFilteredCount;
    const message = `✅ Successfully scraped ${tweets.length} tweets from @${username}`;
    console.log(message);
    console.log(`📁 Saved to ${outputFile}`);
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
        outputFile
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("❌ Scraping failed:", errorMessage);

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
