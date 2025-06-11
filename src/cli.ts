#!/usr/bin/env bun

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';
import { scrapeCommand, embedCommand, askCommand, interactiveCommand } from './commands/index.js';

// Read package.json for version info
const packagePath = join(import.meta.dir, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

const program = new Command();

// Configure the main program
program
  .name('xgpt')
  .description('AI-powered Twitter/X scraping and question-answering tool')
  .version(packageJson.version);

// Add help examples
program.addHelpText('after', `
Examples:
  $ xgpt interactive              # Interactive mode (recommended for new users)
  $ xgpt interactive elonmusk     # Interactive mode for specific user
  $ xgpt scrape elonmusk          # Direct scrape tweets from @elonmusk
  $ xgpt embed                    # Generate embeddings for scraped tweets
  $ xgpt ask "What about AI?"     # Ask questions about the tweets
  $ xgpt --help                   # Show this help message
`);

// Interactive command (recommended for new users)
program
  .command('interactive')
  .description('Interactive mode - guided setup for scraping and analysis')
  .argument('[username]', 'Twitter username to scrape (optional)')
  .action(async (username) => {
    const result = await interactiveCommand(username);

    if (!result.success) {
      console.error(`❌ ${result.message}`);
      if (result.error) console.error(`   ${result.error}`);
      process.exit(1);
    }
  });

// Scrape command
program
  .command('scrape')
  .description('Scrape tweets from a user')
  .argument('<username>', 'Twitter username to scrape')
  .option('--replies', 'Include replies in scraping', false)
  .option('--retweets', 'Include retweets in scraping', false)
  .option('--max <number>', 'Maximum number of tweets to scrape', '10000')
  .action(async (username, options) => {
    const result = await scrapeCommand({
      username,
      includeReplies: options.replies,
      includeRetweets: options.retweets,
      maxTweets: parseInt(options.max)
    });

    if (!result.success) {
      console.error(`❌ ${result.message}`);
      if (result.error) console.error(`   ${result.error}`);
      process.exit(1);
    }
  });

// Embed command
program
  .command('embed')
  .description('Generate embeddings for scraped tweets')
  .option('--model <model>', 'OpenAI embedding model to use', 'text-embedding-3-small')
  .option('--batch <number>', 'Batch size for processing', '1000')
  .option('--input <file>', 'Input file with tweets', 'tweets.json')
  .option('--output <file>', 'Output file for embeddings', 'vectors.json')
  .action(async (options) => {
    const result = await embedCommand({
      model: options.model,
      batchSize: parseInt(options.batch),
      inputFile: options.input,
      outputFile: options.output
    });

    if (!result.success) {
      console.error(`❌ ${result.message}`);
      if (result.error) console.error(`   ${result.error}`);
      process.exit(1);
    }
  });

// Ask command
program
  .command('ask')
  .description('Ask questions about scraped tweets')
  .argument('<question>', 'Question to ask about the tweets')
  .option('--top <number>', 'Number of relevant tweets to consider', '5')
  .option('--model <model>', 'OpenAI model to use for answering', 'gpt-4o-mini')
  .option('--vectors <file>', 'Vector file to search', 'vectors.json')
  .action(async (question, options) => {
    const result = await askCommand({
      question,
      topK: parseInt(options.top),
      model: options.model,
      vectorFile: options.vectors
    });

    if (!result.success) {
      console.error(`❌ ${result.message}`);
      if (result.error) console.error(`   ${result.error}`);
      process.exit(1);
    }
  });

// Error handling for unknown commands
program.on('command:*', () => {
  console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
  process.exit(1);
});

// Parse command line arguments
program.parse();
