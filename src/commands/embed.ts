import OpenAI from "openai";
import { readFile, writeFile } from "fs/promises";
import "dotenv/config";
import type { Tweet, TweetWithEmbedding, EmbeddingOptions, CommandResult } from "../types/common.js";

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
      inputFile = "tweets.json",
      outputFile = "vectors.json"
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

    // Read tweets from file
    console.log(`📖 Reading tweets from ${inputFile}...`);
    let tweets: Tweet[];
    
    try {
      const fileContent = await readFile(inputFile, "utf8");
      tweets = JSON.parse(fileContent);
    } catch (error) {
      return {
        success: false,
        message: `Failed to read ${inputFile}`,
        error: error instanceof Error ? error.message : "File read error"
      };
    }

    if (!Array.isArray(tweets) || tweets.length === 0) {
      return {
        success: false,
        message: "No tweets found",
        error: `${inputFile} is empty or contains invalid data`
      };
    }

    console.log(`📊 Found ${tweets.length} tweets to embed`);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
    const embeddings: TweetWithEmbedding[] = [];

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
            embeddings.push({
              ...tweet,
              vec: embeddingData.embedding
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

    // Save embeddings to file
    console.log(`💾 Saving embeddings to ${outputFile}...`);
    await writeFile(outputFile, JSON.stringify(embeddings, null, 2));

    const message = `✅ Successfully generated embeddings for ${embeddings.length} tweets`;
    console.log(message);
    console.log(`📁 Saved to ${outputFile}`);

    return {
      success: true,
      message,
      data: {
        tweetsEmbedded: embeddings.length,
        model,
        outputFile,
        vectorDimensions: embeddings[0]?.vec.length || 0
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
