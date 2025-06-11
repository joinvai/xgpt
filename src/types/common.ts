// Common types used across the application

export interface Tweet {
  id: string;
  text: string;
  user?: string;
  created_at?: string;
  metadata?: Record<string, any>;
}

export interface TweetWithEmbedding extends Tweet {
  vec: number[];
}

export interface Row {
  id: string;
  text: string;
  vec: number[];
}

export interface ScrapingOptions {
  username: string;
  includeReplies?: boolean;
  includeRetweets?: boolean;
  keywords?: string[];
  maxTweets?: number;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

export interface EmbeddingOptions {
  model?: string;
  batchSize?: number;
  inputFile?: string;
  outputFile?: string;
}

export interface QueryOptions {
  question: string;
  topK?: number;
  model?: string;
  vectorFile?: string;
}

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}
