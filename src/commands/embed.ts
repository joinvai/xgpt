import OpenAI from "openai";
import "dotenv/config";
import type { Tweet, TweetWithEmbedding, EmbeddingOptions, CommandResult } from "../types/common.js";
import { tweetQueries, embeddingQueries } from "../database/queries.js";
import type { NewEmbedding } from "../database/schema.js";

function chunkArray<T>(arr: T[], n: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / n) }, (_v, i) =>
    arr.slice(i * n, i * n + n)
  );
}

export async function embedCommand(options: EmbeddingOptions = {}): Promise<CommandResult> {
  try {
    const {
      model = "text-embedding-3-small",
      batchSize = 1000,
      inputFile = "tweets.json", // Legacy parameter, now ignored
      outputFile = "vectors.json" // Legacy parameter, now ignored
    } = options;

    console.log(`🧠 Starting embedding generation...`);
    console.log(`📊 Model: ${model}, Batch size: ${batchSize}`);

    // Check for OpenAI API key
    if (!process.env.OPENAI_KEY) {
      return {
        success: false,
        message: "Missing OpenAI API key",
        error: "Please set OPENAI_KEY environment variable"
      };
    }

    // Read tweets from database
    console.log(`📖 Reading tweets from database...`);
    let tweets: Tweet[];

    try {
      const dbTweets = await tweetQueries.getTweetsWithoutEmbeddings();

      if (dbTweets.length === 0) {
        return {
          success: false,
          message: "No tweets without embeddings found in database",
          error: "All tweets already have embeddings, or no tweets exist. Scrape some tweets first using: xgpt scrape <username>"
        };
      }

      // Convert database tweets to Tweet format
      tweets = dbTweets.map(dbTweet => ({
        id: dbTweet.id,
        text: dbTweet.text,
        user: dbTweet.username,
        created_at: dbTweet.createdAt?.toISOString(),
        metadata: dbTweet.metadata ? JSON.parse(dbTweet.metadata as string) : undefined
      }));

    } catch (error) {
      return {
        success: false,
        message: "Failed to read tweets from database",
        error: error instanceof Error ? error.message : "Database query failed"
      };
    }

    console.log(`📊 Found ${tweets.length} tweets to embed`);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
    const embeddings: TweetWithEmbedding[] = [];
    const embeddingBatch: NewEmbedding[] = [];

    // Process tweets in chunks
    const chunks = chunkArray(tweets, batchSize);
    let processedCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`🔄 Processing chunk ${i + 1}/${chunks.length} (${chunk.length} tweets)...`);

      try {
        const response = await openai.embeddings.create({
          model,
          input: chunk.map(tweet => tweet.text)
        });

        // Combine tweets with their embeddings
        response.data.forEach((embeddingData, index) => {
          const tweet = chunk[index];
          if (tweet) {
            // For legacy compatibility (vectors.json format)
            embeddings.push({
              ...tweet,
              vec: embeddingData.embedding
            });

            // Prepare for database insertion
            embeddingBatch.push({
              tweetId: tweet.id,
              model: model,
              vector: JSON.stringify(embeddingData.embedding),
              dimensions: embeddingData.embedding.length
            });
          }
        });

        processedCount += chunk.length;
        console.log(`✅ Embedded ${processedCount}/${tweets.length} tweets`);

        // Small delay to respect rate limits
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`❌ Failed to process chunk ${i + 1}:`, error);
        return {
          success: false,
          message: `Failed to generate embeddings for chunk ${i + 1}`,
          error: error instanceof Error ? error.message : "Embedding generation failed"
        };
      }
    }

    // Save embeddings to database
    if (embeddingBatch.length > 0) {
      console.log(`💾 Saving ${embeddingBatch.length} embeddings to database...`);
      try {
        await embeddingQueries.insertEmbeddings(embeddingBatch);
        console.log(`✅ Successfully saved ${embeddingBatch.length} embeddings to database`);
      } catch (error) {
        console.error(`❌ Failed to save embeddings to database:`, error);
        return {
          success: false,
          message: "Failed to save embeddings to database",
          error: error instanceof Error ? error.message : "Database insertion failed"
        };
      }
    }

    const message = `✅ Successfully generated embeddings for ${embeddings.length} tweets`;
    console.log(message);
    console.log(`💾 Saved to SQLite database`);

    return {
      success: true,
      message,
      data: {
        tweetsEmbedded: embeddings.length,
        model,
        vectorDimensions: embeddings[0]?.vec.length || 0,
        embeddingsInDatabase: embeddingBatch.length
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("❌ Embedding generation failed:", errorMessage);

    return {
      success: false,
      message: "Embedding generation failed",
      error: errorMessage
    };
  }
}

// Legacy function for backward compatibility
export async function generateEmbeddings(): Promise<CommandResult> {
  return embedCommand();
}
