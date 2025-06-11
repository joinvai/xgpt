import OpenAI from "openai";
import { readFile } from "fs/promises";
import "dotenv/config";
import type { TweetWithEmbedding, QueryOptions, CommandResult } from "../types/common.js";

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    const aVal = a[i] ?? 0;
    const bVal = b[i] ?? 0;
    dot += aVal * bVal;
    normA += aVal * aVal;
    normB += bVal * bVal;
  }
  
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function askCommand(options: QueryOptions): Promise<CommandResult> {
  try {
    const {
      question,
      topK = 5,
      model = "gpt-4o-mini",
      vectorFile = "vectors.json"
    } = options;

    console.log(`🤔 Processing question: "${question}"`);

    // Check for OpenAI API key
    if (!process.env.OPENAI_KEY) {
      return {
        success: false,
        message: "Missing OpenAI API key",
        error: "Please set OPENAI_KEY environment variable"
      };
    }

    // Read embeddings from file
    console.log(`📖 Loading embeddings from ${vectorFile}...`);
    let embeddings: TweetWithEmbedding[];
    
    try {
      const fileContent = await readFile(vectorFile, "utf8");
      embeddings = JSON.parse(fileContent);
    } catch (error) {
      return {
        success: false,
        message: `Failed to read ${vectorFile}`,
        error: `Please run 'twtgpt embed' first to generate embeddings. ${error instanceof Error ? error.message : ''}`
      };
    }

    if (!Array.isArray(embeddings) || embeddings.length === 0) {
      return {
        success: false,
        message: "No embeddings found",
        error: `${vectorFile} is empty or contains invalid data`
      };
    }

    console.log(`📊 Found ${embeddings.length} tweet embeddings`);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

    // Generate embedding for the question
    console.log(`🧠 Generating embedding for question...`);
    const questionEmbedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question
    });

    const questionVector = questionEmbedding.data[0]?.embedding;
    if (!questionVector) {
      return {
        success: false,
        message: "Failed to generate question embedding",
        error: "OpenAI API returned empty embedding"
      };
    }

    // Find most similar tweets using cosine similarity
    console.log(`🔍 Finding ${topK} most relevant tweets...`);
    const similarities = embeddings
      .map(tweet => ({
        ...tweet,
        similarity: cosine(questionVector, tweet.vec)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    // Prepare context for GPT
    const context = similarities
      .map((tweet, index) => `${index + 1}. ${tweet.text} (similarity: ${tweet.similarity.toFixed(3)})`)
      .join("\n");

    console.log(`🤖 Generating answer using ${model}...`);

    // Generate answer using GPT
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that answers questions based on tweet content. Use the provided tweets as context to answer the user's question. Be concise and reference specific tweets when relevant."
        },
        {
          role: "user",
          content: `Question: ${question}\n\nRelevant tweets:\n${context}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const answer = response.choices[0]?.message?.content;
    if (!answer) {
      return {
        success: false,
        message: "Failed to generate answer",
        error: "OpenAI API returned empty response"
      };
    }

    // Display results
    console.log("\n" + "=".repeat(60));
    console.log("🎯 ANSWER:");
    console.log("=".repeat(60));
    console.log(answer);
    console.log("\n" + "=".repeat(60));
    console.log("📚 RELEVANT TWEETS:");
    console.log("=".repeat(60));
    
    similarities.forEach((tweet, index) => {
      console.log(`${index + 1}. [${tweet.similarity.toFixed(3)}] ${tweet.text}`);
      if (tweet.user) console.log(`   👤 @${tweet.user}`);
      if (tweet.created_at) console.log(`   📅 ${new Date(tweet.created_at).toLocaleDateString()}`);
      console.log();
    });

    return {
      success: true,
      message: "Question answered successfully",
      data: {
        question,
        answer,
        relevantTweets: similarities.map(t => ({
          text: t.text,
          similarity: t.similarity,
          user: t.user,
          created_at: t.created_at
        })),
        model,
        topK
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("❌ Question answering failed:", errorMessage);
    
    return {
      success: false,
      message: "Question answering failed",
      error: errorMessage
    };
  }
}

// Legacy function for backward compatibility
export async function askQuestion(question: string): Promise<CommandResult> {
  return askCommand({ question });
}
