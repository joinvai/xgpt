#!/usr/bin/env bun

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join } from 'path';
import { scrapeCommand, embedCommand, askCommand, interactiveCommand } from './commands/index.js';
import { initializeDatabase, checkDatabaseHealth, getDatabaseStats } from './database/connection.js';
import { runMigration } from './database/migrate-json.js';
import { statsQueries } from './database/queries.js';
import { optimizeDatabase, getDatabaseMetrics, runPerformanceBenchmarks, monitorDatabaseSize } from './database/optimization.js';
import { runBenchmarkCLI } from '../benchmarks/sqlite-performance.js';

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
  $ xgpt db --stats               # Show database statistics
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

// Database command
program
  .command('db')
  .description('Database management and statistics')
  .option('--stats', 'Show database statistics')
  .option('--health', 'Check database health')
  .option('--init', 'Initialize/reset database')
  .action(async (options) => {
    if (options.init) {
      console.log('🔄 Initializing database...');
      await initializeDatabase();
      console.log('✅ Database initialized successfully');
      return;
    }

    if (options.health) {
      const isHealthy = checkDatabaseHealth();
      console.log(`🏥 Database health: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
      if (!isHealthy) process.exit(1);
      return;
    }

    if (options.stats) {
      const dbStats = getDatabaseStats();
      const appStats = await statsQueries.getOverallStats();

      console.log('📊 Database Statistics:');
      console.log(`   • File size: ${dbStats?.sizeMB} MB`);
      console.log(`   • WAL mode: ${dbStats?.walMode}`);
      console.log(`   • Foreign keys: ${dbStats?.foreignKeysEnabled ? 'enabled' : 'disabled'}`);
      console.log(`   • Users: ${appStats.users}`);
      console.log(`   • Tweets: ${appStats.tweets}`);
      console.log(`   • Embeddings: ${appStats.embeddings}`);
      console.log(`   • Sessions: ${appStats.sessions}`);
      return;
    }

    // Default: show help for db command
    console.log('Database management commands:');
    console.log('  xgpt db --stats    Show database statistics');
    console.log('  xgpt db --health   Check database health');
    console.log('  xgpt db --init     Initialize/reset database');
  });

// Migration command
program
  .command('migrate')
  .description('Migrate JSON data to SQLite database')
  .option('--tweets <file>', 'Tweets JSON file to migrate', 'tweets.json')
  .option('--vectors <file>', 'Vectors JSON file to migrate', 'vectors.json')
  .option('--batch-size <number>', 'Batch size for processing', '1000')
  .option('--skip-backup', 'Skip creating backup files', false)
  .option('--skip-validation', 'Skip data validation', false)
  .action(async (options) => {
    await ensureDatabaseReady();

    await runMigration({
      tweetsFile: options.tweets,
      vectorsFile: options.vectors,
      batchSize: parseInt(options.batchSize),
      skipBackup: options.skipBackup,
      skipValidation: options.skipValidation
    });
  });

// Optimize command
program
  .command('optimize')
  .description('Optimize database performance')
  .option('--indexes', 'Create performance indexes', true)
  .option('--vacuum', 'Run database vacuum', true)
  .option('--analyze', 'Update query statistics', true)
  .option('--pragma', 'Apply pragma optimizations', true)
  .option('--metrics', 'Show performance metrics after optimization', false)
  .action(async (options) => {
    await ensureDatabaseReady();

    console.log('⚡ Starting database optimization...');

    await optimizeDatabase({
      enableIndexes: options.indexes,
      enableVacuum: options.vacuum,
      enableAnalyze: options.analyze,
      enablePragmaOptimizations: options.pragma,
      logSlowQueries: true,
      slowQueryThreshold: 100
    });

    if (options.metrics) {
      console.log('\n📊 Performance Metrics:');
      await getDatabaseMetrics();

      console.log('\n🏃 Running Benchmarks:');
      await runPerformanceBenchmarks();

      console.log('\n📏 Database Size:');
      await monitorDatabaseSize();
    }

    console.log('\n✅ Database optimization completed!');
  });

// Benchmark command
program
  .command('benchmark')
  .description('Run performance benchmarks')
  .option('--optimize', 'Run optimization before benchmarking', true)
  .option('--report', 'Generate detailed report', true)
  .option('--size <size>', 'Test data size (small|medium|large)', 'small')
  .option('--iterations <number>', 'Number of benchmark iterations', '3')
  .action(async (options) => {
    await ensureDatabaseReady();

    await runBenchmarkCLI({
      optimize: options.optimize,
      report: options.report,
      size: options.size as 'small' | 'medium' | 'large',
      iterations: parseInt(options.iterations)
    });
  });

// Error handling for unknown commands
program.on('command:*', () => {
  console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
  process.exit(1);
});

// Initialize database before running commands
async function ensureDatabaseReady() {
  try {
    // Check if database is healthy
    if (!checkDatabaseHealth()) {
      // Initialize database if not healthy
      await initializeDatabase();
    }
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('Please check your database configuration and try again.');
    process.exit(1);
  }
}

// Parse command line arguments and ensure database is ready
async function main() {
  // Only initialize database for commands that need it (not for --help or --version)
  const args = process.argv.slice(2);
  const needsDatabase = args.length > 0 &&
    !args.includes('--help') &&
    !args.includes('-h') &&
    !args.includes('--version') &&
    !args.includes('-V');

  if (needsDatabase) {
    await ensureDatabaseReady();
  }

  program.parse();
}

// Run the CLI
main().catch((error) => {
  console.error('❌ CLI error:', error);
  process.exit(1);
});
