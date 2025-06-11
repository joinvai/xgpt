import { Scraper } from "@the-convocation/twitter-scraper";
import { writeFile } from "fs/promises";
import "dotenv/config";
import type { ScrapingOptions, Tweet, CommandResult } from "../types/common.js";

export async function scrapeCommand(options: ScrapingOptions): Promise<CommandResult> {
  try {
    const { username, includeReplies = false, includeRetweets = false, maxTweets = 10000 } = options;
    
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

    console.log(`📊 Filters: Replies=${includeReplies}, Retweets=${includeRetweets}`);
    
    for await (const tweet of scraper.getTweets(username)) {
      scrapedCount++;
      
      // Apply filters
      if (!includeRetweets && tweet.isRetweet) {
        filteredCount++;
        continue;
      }
      
      if (!includeReplies && tweet.isReply) {
        filteredCount++;
        continue;
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
      
      // Progress indicator
      if (tweets.length % 100 === 0) {
        console.log(`📥 Collected ${tweets.length} tweets (${filteredCount} filtered out)...`);
      }

      if (tweets.length >= maxTweets) {
        console.log(`🎯 Reached maximum tweet limit (${maxTweets})`);
        break;
      }
    }

    // Save to JSON file (will be replaced with SQLite in CLI-003)
    const outputFile = "tweets.json";
    await writeFile(outputFile, JSON.stringify(tweets, null, 2));
    
    const message = `✅ Successfully scraped ${tweets.length} tweets from @${username}`;
    console.log(message);
    console.log(`📁 Saved to ${outputFile}`);
    console.log(`📊 Total processed: ${scrapedCount}, Filtered out: ${filteredCount}`);

    return {
      success: true,
      message,
      data: {
        tweetsCollected: tweets.length,
        totalProcessed: scrapedCount,
        filteredOut: filteredCount,
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
