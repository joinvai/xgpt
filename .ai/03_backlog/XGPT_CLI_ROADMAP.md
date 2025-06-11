# X-GPT CLI Roadmap Implementation

Transform X-GPT from script-based tool to interactive CLI application called `twtgpt`.

## Completed Tasks

- [x] Create comprehensive README.md with roadmap
- [x] Basic tweet scraping functionality
- [x] OpenAI embedding generation
- [x] Semantic search and Q&A system
- [x] **CLI-001: Set up CLI framework** - Commander.js integration, help/version commands
- [x] **CLI-002: Project restructuring** - Modular command structure with enhanced options
- [x] **PROMPT-001: Content type selection** - Interactive prompts for tweets/replies/both
- [x] **PROMPT-002: Search scope selection** - Keyword filtering with validation
- [x] **PROMPT-003: Time range filtering** - Date range selection with custom options

## Phase 1: CLI Foundation (Priority: High)

### In Progress Tasks

- [x] **CLI-001: Set up CLI framework** ✅
  - [x] **CLI-001a**: Research Bun-compatible CLI libraries (commander.js selected and tested)
  - [x] **CLI-001b**: Install chosen CLI library: `bun add commander`
  - [x] **CLI-001c**: Create `src/cli.ts` with basic CLI structure and imports
  - [x] **CLI-001d**: Set up main command structure with `twtgpt` as root command
  - [x] **CLI-001e**: Add `--help` flag with usage information and examples
  - [x] **CLI-001f**: Add `--version` flag reading from package.json
  - [x] **CLI-001g**: Update `package.json` with `"bin": { "twtgpt": "./src/cli.ts" }` field
  - [x] **CLI-001h**: Add shebang `#!/usr/bin/env bun` to cli.ts for executable
  - [x] **CLI-001i**: Test CLI installation: `bun run src/cli.ts --help` works
  - [x] **CLI-001j**: Create basic error handling for invalid commands
  - **Files**: `src/cli.ts` ✅, `package.json` ✅
  - **Dependencies**: None
  - **Acceptance**: `twtgpt --help` and `twtgpt --version` work ✅

- [x] **CLI-002: Project restructuring** ✅
  - [x] **CLI-002a**: Create `src/commands/` directory structure
  - [x] **CLI-002b**: Move `scrape.ts` logic to `src/commands/scrape.ts` as command module
  - [x] **CLI-002c**: Move `src/embed.ts` logic to `src/commands/embed.ts` as command module
  - [x] **CLI-002d**: Move `src/ask.ts` logic to `src/commands/ask.ts` as command module
  - [x] **CLI-002e**: Create `src/commands/index.ts` to export all commands
  - [x] **CLI-002f**: Update imports and exports to use new module structure
  - [x] **CLI-002g**: Create `src/types/` directory for shared TypeScript types
  - [x] **CLI-002h**: Move common types (Row, Tweet, etc.) to `src/types/common.ts`
  - [x] **CLI-002i**: Update CLI entry point to register all commands
  - [x] **CLI-002j**: Test that all existing functionality works with new structure
  - **Files**: `src/commands/scrape.ts` ✅, `src/commands/embed.ts` ✅, `src/commands/ask.ts` ✅, `src/commands/index.ts` ✅, `src/types/common.ts` ✅
  - **Dependencies**: CLI-001 ✅
  - **Acceptance**: All commands work via CLI, code is modular and organized ✅

### Future Tasks

- [ ] **CLI-003: Database migration setup (Bun SQLite + Drizzle ORM)**
  - **CLI-003a**: Install Drizzle ORM: `bun add drizzle-orm drizzle-kit`
  - **CLI-003b**: Create `drizzle.config.ts` for Drizzle Kit configuration with Bun SQLite
  - **CLI-003c**: Create `src/database/connection.ts` using `import { Database } from "bun:sqlite"`
  - **CLI-003d**: Set up Drizzle with Bun SQLite: `drizzle({ client: sqlite })`
  - **CLI-003e**: Enable WAL mode: `db.run("PRAGMA journal_mode = WAL;")` for performance
  - **CLI-003f**: Design `tweets` table schema with Drizzle schema syntax (id, text, user, created_at, metadata)
  - **CLI-003g**: Design `embeddings` table with vector storage (tweet_id, vector JSON, model, created_at)
  - **CLI-003h**: Design `users` table for tracking scraped users (username, display_name, last_scraped)
  - **CLI-003i**: Design `scrape_sessions` table for session metadata (id, user, filters, created_at)
  - **CLI-003j**: Create `src/database/schema.ts` with all Drizzle table definitions
  - **CLI-003k**: Set up Drizzle migrations with `drizzle-kit generate`
  - **CLI-003l**: Create initial migration files for all tables using Drizzle Kit
  - **CLI-003m**: Implement database initialization with `drizzle-kit migrate`
  - **CLI-003n**: Create `src/database/queries.ts` with Drizzle query helpers and operations
  - **CLI-003o**: Add database connection pooling and error handling for production use
  - **Files**: `src/database/connection.ts`, `src/database/schema.ts`, `drizzle.config.ts`, `src/database/queries.ts`
  - **Dependencies**: CLI-002
  - **Acceptance**: Drizzle ORM + Bun SQLite setup with migrations, WAL mode enabled, type-safe queries

- [ ] **CLI-004: Data migration from JSON to SQLite**
  - **CLI-004a**: Create migration script `src/database/migrate-json.ts` to read existing JSON files
  - **CLI-004b**: Parse and validate `tweets.json` data before insertion using Drizzle schemas
  - **CLI-004c**: Batch insert tweets using Drizzle's batch API: `db.insert(tweets).values(data)`
  - **CLI-004d**: Migrate embeddings from `vectors.json` to embeddings table with proper indexing
  - **CLI-004e**: Handle data validation and error recovery during migration process
  - **CLI-004f**: Create backup of JSON files before migration starts
  - **CLI-004g**: Add progress indicators for migration process using cli-progress
  - **CLI-004h**: Verify data integrity after migration (count checks, sample validation)
  - **CLI-004i**: Update all commands (scrape, embed, ask) to use SQLite instead of JSON
  - **CLI-004j**: Add fallback to JSON if SQLite operations fail (graceful degradation)
  - **CLI-004k**: Test migration with various dataset sizes (small, medium, large)
  - **Files**: `src/database/migrate-json.ts`, `src/database/validation.ts`
  - **Dependencies**: CLI-003
  - **Acceptance**: All existing JSON data successfully migrated to SQLite with data integrity

- [ ] **CLI-005: SQLite performance optimization**
  - **CLI-005a**: Implement proper indexing for tweet searches (user, date, keywords) using Drizzle
  - **CLI-005b**: Add indexes for embedding similarity searches and vector operations
  - **CLI-005c**: Optimize vector storage (consider separate table for large embeddings if needed)
  - **CLI-005d**: Implement connection pooling for concurrent operations using Bun SQLite
  - **CLI-005e**: Add query performance monitoring and logging for slow queries
  - **CLI-005f**: Test with large datasets (50k+ tweets, 10k+ embeddings) for scalability
  - **CLI-005g**: Benchmark SQLite vs JSON performance (read/write operations, memory usage)
  - **CLI-005h**: Implement database vacuum and optimization routines for maintenance
  - **CLI-005i**: Add database size monitoring and cleanup for old data
  - **CLI-005j**: Test concurrent read/write operations under load using Bun's async capabilities
  - **CLI-005k**: Create performance report with recommendations and benchmarks
  - **Files**: `src/database/optimization.ts`, `benchmarks/sqlite-performance.ts`, `benchmarks/performance-report.md`
  - **Dependencies**: CLI-004
  - **Acceptance**: SQLite performs 3x+ faster than JSON for large datasets, handles 50k+ tweets efficiently

## Phase 2: Interactive Prompts (Priority: High)

### Completed Tasks

- [x] **PROMPT-001: Content type selection** ✅
  - [x] **PROMPT-001a**: Research Bun-compatible prompt libraries (@inquirer/prompts selected)
  - [x] **PROMPT-001b**: Install chosen prompt library: `bun add @inquirer/prompts`
  - [x] **PROMPT-001c**: Create `src/prompts/` directory structure
  - [x] **PROMPT-001d**: Create `src/prompts/contentType.ts` with content type selection logic
  - [x] **PROMPT-001e**: Implement radio button selection: "Tweets only", "Replies only", "Both"
  - [x] **PROMPT-001f**: Add input validation to ensure valid selection
  - [x] **PROMPT-001g**: Add default selection (Tweets only) for quick usage
  - [x] **PROMPT-001h**: Store user selection in session object for later use
  - [x] **PROMPT-001i**: Add help text explaining each option
  - [x] **PROMPT-001j**: Test prompt functionality and user experience
  - **Files**: `src/prompts/contentType.ts` ✅, `src/types/session.ts` ✅
  - **Dependencies**: CLI-001 ✅
  - **Acceptance**: User can interactively select content type with validation ✅

- [x] **PROMPT-002: Search scope selection** ✅
  - [x] **PROMPT-002a**: Create `src/prompts/searchScope.ts` with scope selection logic
  - [x] **PROMPT-002b**: Implement radio button selection: "All posts", "Keyword filtered"
  - [x] **PROMPT-002c**: Add conditional keyword input when "Keyword filtered" is selected
  - [x] **PROMPT-002d**: Implement keyword input with placeholder text and examples
  - [x] **PROMPT-002e**: Add comma-separated keyword parsing and validation
  - [x] **PROMPT-002f**: Trim whitespace and handle empty keywords
  - [x] **PROMPT-002g**: Show example format: "AI, programming, typescript"
  - [x] **PROMPT-002h**: Add keyword preview/confirmation before proceeding
  - [x] **PROMPT-002i**: Store keywords array in session object
  - [x] **PROMPT-002j**: Add option to go back and modify keywords
  - **Files**: `src/prompts/searchScope.ts` ✅, keyword parsing integrated
  - **Dependencies**: PROMPT-001 ✅
  - **Acceptance**: User can select scope and enter validated keywords ✅

- [x] **PROMPT-003: Time range filtering** ✅
  - [x] **PROMPT-003a**: Create `src/prompts/timeRange.ts` with time range selection
  - [x] **PROMPT-003b**: Create `src/utils/dateUtils.ts` with date calculation functions
  - [x] **PROMPT-003c**: Implement radio selection: "Last week", "Last month", "Last 3 months", etc.
  - [x] **PROMPT-003d**: Add "Custom range" option with date input prompts
  - [x] **PROMPT-003e**: Calculate start/end dates for each predefined range
  - [x] **PROMPT-003f**: Validate custom date inputs (format, logical order)
  - [x] **PROMPT-003g**: Display calculated date range for user confirmation
  - [x] **PROMPT-003h**: Store date range in session object (startDate, endDate)
  - [x] **PROMPT-003i**: Add timezone handling for accurate date filtering
  - [x] **PROMPT-003j**: Test date calculations with various timezones
  - **Files**: `src/prompts/timeRange.ts` ✅, `src/utils/dateUtils.ts` ✅, `src/types/session.ts` ✅
  - **Dependencies**: PROMPT-002 ✅
  - **Acceptance**: User can select time ranges with accurate date calculations ✅

## Phase 3: Enhanced Scraping (Priority: Medium)

### Future Tasks

- [ ] **SCRAPE-001: Implement content filtering**
  - **SCRAPE-001a**: Create `src/scraper/` directory structure
  - **SCRAPE-001b**: Create `src/scraper/filters.ts` with filtering logic
  - **SCRAPE-001c**: Implement reply filtering based on user selection
  - **SCRAPE-001d**: Implement retweet filtering based on user selection
  - **SCRAPE-001e**: Create keyword matching algorithm (case-insensitive, partial match)
  - **SCRAPE-001f**: Implement keyword filtering during tweet processing
  - **SCRAPE-001g**: Add filter statistics (tweets filtered out, reasons)
  - **SCRAPE-001h**: Update scrape command to use session filters
  - **SCRAPE-001i**: Add filter preview mode to show what would be filtered
  - **SCRAPE-001j**: Test filtering with various content types and keywords
  - **Files**: `src/scraper/filters.ts`, `src/types/filters.ts`
  - **Dependencies**: PROMPT-003
  - **Acceptance**: Scraping accurately filters content based on user preferences

- [ ] **SCRAPE-002: Time-based filtering**
  - **SCRAPE-002a**: Create `src/scraper/timeFilter.ts` with date filtering logic
  - **SCRAPE-002b**: Implement tweet date parsing and validation
  - **SCRAPE-002c**: Add date range filtering during scraping process
  - **SCRAPE-002d**: Optimize filtering to stop scraping when outside date range
  - **SCRAPE-002e**: Add progress indicators showing date progress
  - **SCRAPE-002f**: Handle timezone differences in tweet timestamps
  - **SCRAPE-002g**: Add date-based early termination for efficiency
  - **SCRAPE-002h**: Create date filtering statistics and reporting
  - **SCRAPE-002i**: Test with various date ranges and timezones
  - **SCRAPE-002j**: Add fallback for tweets with missing/invalid dates
  - **Files**: `src/scraper/timeFilter.ts`, `src/utils/dateParser.ts`
  - **Dependencies**: SCRAPE-001
  - **Acceptance**: Only tweets within specified time range are scraped efficiently

- [ ] **SCRAPE-003: Duplicate detection**
  - **SCRAPE-003a**: Create `src/scraper/duplicateDetection.ts` with deduplication logic
  - **SCRAPE-003b**: Implement tweet ID-based duplicate detection
  - **SCRAPE-003c**: Add content-based similarity detection for near-duplicates
  - **SCRAPE-003d**: Create database UNIQUE constraints on tweet IDs
  - **SCRAPE-003e**: Implement hash-based content comparison
  - **SCRAPE-003f**: Add duplicate statistics and reporting
  - **SCRAPE-003g**: Handle edge cases (deleted/modified tweets)
  - **SCRAPE-003h**: Create duplicate resolution strategies (keep newest, etc.)
  - **SCRAPE-003i**: Test with datasets containing known duplicates
  - **SCRAPE-003j**: Add option to show duplicate detection results
  - **Files**: `src/scraper/duplicateDetection.ts`, `src/utils/contentHash.ts`
  - **Dependencies**: CLI-003
  - **Acceptance**: No duplicate tweets in database, comprehensive detection

## Phase 4: Performance & Reliability (Priority: Medium)

### Future Tasks

- [ ] **PERF-001: Caching system**
  - **PERF-001a**: Create `src/cache/` directory structure
  - **PERF-001b**: Create `src/cache/manager.ts` with cache management logic
  - **PERF-001c**: Implement file-based caching using Bun's file system APIs
  - **PERF-001d**: Create cache key generation for tweets and embeddings
  - **PERF-001e**: Implement TTL (time-to-live) for cache entries
  - **PERF-001f**: Create `src/cache/strategies.ts` with different caching strategies
  - **PERF-001g**: Implement LRU (Least Recently Used) cache eviction
  - **PERF-001h**: Add cache size limits and cleanup mechanisms
  - **PERF-001i**: Cache tweet data to avoid re-scraping recent content
  - **PERF-001j**: Cache embeddings to avoid regenerating vectors
  - **PERF-001k**: Add cache statistics and monitoring
  - **PERF-001l**: Create cache invalidation for stale data
  - **PERF-001m**: Test cache performance with large datasets
  - **PERF-001n**: Add cache configuration options
  - **Files**: `src/cache/manager.ts`, `src/cache/strategies.ts`, `src/cache/config.ts`
  - **Dependencies**: CLI-003
  - **Acceptance**: Caching reduces API calls and improves performance significantly

- [ ] **PERF-002: Rate limiting**
  - **PERF-002a**: Create `src/rateLimit/` directory structure
  - **PERF-002b**: Create `src/rateLimit/manager.ts` with rate limiting logic
  - **PERF-002c**: Implement token bucket algorithm for rate limiting
  - **PERF-002d**: Add configurable rate limits for different API endpoints
  - **PERF-002e**: Implement exponential backoff for failed requests
  - **PERF-002f**: Add retry logic with jitter to avoid thundering herd
  - **PERF-002g**: Handle X/Twitter rate limit headers and responses
  - **PERF-002h**: Add rate limit status monitoring and logging
  - **PERF-002i**: Implement graceful degradation when rate limited
  - **PERF-002j**: Add user notifications for rate limit delays
  - **PERF-002k**: Test rate limiting with high-volume scraping
  - **PERF-002l**: Create rate limit configuration options
  - **Files**: `src/rateLimit/manager.ts`, `src/rateLimit/config.ts`, `src/utils/backoff.ts`
  - **Dependencies**: SCRAPE-001
  - **Acceptance**: Tool respects all rate limits and handles errors gracefully

- [ ] **PERF-003: Progress indicators**
  - **PERF-003a**: Create `src/ui/` directory structure
  - **PERF-003b**: Create `src/ui/progress.ts` with progress bar components
  - **PERF-003c**: Install Bun-compatible progress bar library
  - **PERF-003d**: Implement progress bars for tweet scraping operations
  - **PERF-003e**: Add progress indicators for embedding generation
  - **PERF-003f**: Show time estimates based on current progress
  - **PERF-003g**: Display completion percentages and ETA
  - **PERF-003h**: Add operation status messages (scraping, processing, etc.)
  - **PERF-003i**: Implement multi-step progress for complex operations
  - **PERF-003j**: Add progress persistence for resumable operations
  - **PERF-003k**: Create spinner animations for indeterminate progress
  - **PERF-003l**: Test progress indicators with various operation sizes
  - **Files**: `src/ui/progress.ts`, `src/ui/spinner.ts`, `src/ui/status.ts`
  - **Dependencies**: CLI-001
  - **Acceptance**: Users see clear, accurate progress for all long operations

## Phase 5: User Experience (Priority: Low)

### Future Tasks

- [ ] **UX-001: Configuration system**
  - **UX-001a**: Create `src/config/` directory structure
  - **UX-001b**: Create `src/config/manager.ts` with configuration management
  - **UX-001c**: Design configuration schema with default values
  - **UX-001d**: Implement user config directory creation (`~/.xgpt/`)
  - **UX-001e**: Create `config.json` file with user preferences
  - **UX-001f**: Add config commands: `twtgpt config set <key> <value>`
  - **UX-001g**: Add config commands: `twtgpt config get <key>`
  - **UX-001h**: Add config commands: `twtgpt config list`
  - **UX-001i**: Add config commands: `twtgpt config reset`
  - **UX-001j**: Implement environment-specific config overrides
  - **UX-001k**: Add config validation and type checking
  - **UX-001l**: Create config migration system for updates
  - **UX-001m**: Test config persistence and loading
  - **UX-001n**: Add config backup and restore functionality
  - **Files**: `src/config/manager.ts`, `src/config/schema.ts`, `src/commands/config.ts`
  - **Dependencies**: CLI-001
  - **Acceptance**: Users can save, modify, and reuse all preferences

- [ ] **UX-002: Enhanced error handling**
  - **UX-002a**: Create `src/errors/` directory structure
  - **UX-002b**: Create `src/errors/types.ts` with custom error classes
  - **UX-002c**: Create `src/errors/handler.ts` with centralized error handling
  - **UX-002d**: Implement user-friendly error messages for common issues
  - **UX-002e**: Add error codes and categorization system
  - **UX-002f**: Create error recovery mechanisms and suggestions
  - **UX-002g**: Add error logging with different severity levels
  - **UX-002h**: Implement graceful degradation for non-critical errors
  - **UX-002i**: Add error reporting and debugging information
  - **UX-002j**: Create error handling for network issues
  - **UX-002k**: Add error handling for authentication problems
  - **UX-002l**: Test error scenarios and recovery paths
  - **Files**: `src/errors/handler.ts`, `src/errors/types.ts`, `src/errors/recovery.ts`
  - **Dependencies**: CLI-002
  - **Acceptance**: All errors provide helpful messages and recovery options

- [ ] **UX-003: Export options**
  - **UX-003a**: Create `src/export/` directory structure
  - **UX-003b**: Create `src/export/formats.ts` with export format handlers
  - **UX-003c**: Implement JSON export with customizable formatting
  - **UX-003d**: Implement CSV export with configurable columns
  - **UX-003e**: Implement Markdown export with readable formatting
  - **UX-003f**: Add XML export for structured data needs
  - **UX-003g**: Create `src/commands/export.ts` with export commands
  - **UX-003h**: Add export filtering options (date range, keywords, etc.)
  - **UX-003i**: Implement export templates for different use cases
  - **UX-003j**: Add export compression options (zip, gzip)
  - **UX-003k**: Create export scheduling and automation
  - **UX-003l**: Add export validation and integrity checks
  - **UX-003m**: Test exports with large datasets
  - **UX-003n**: Add export progress indicators
  - **Files**: `src/export/formats.ts`, `src/commands/export.ts`, `src/export/templates.ts`
  - **Dependencies**: CLI-003
  - **Acceptance**: Users can export data in multiple formats with full customization

## Implementation Plan

### Relevant Files

- `src/cli.ts` - Main CLI entry point ⏳
- `src/commands/` - Command modules directory ⏳
- `src/prompts/` - Interactive prompt modules ⏳
- `src/database/` - Database schema and migrations ⏳
- `src/scraper/` - Enhanced scraping logic ⏳
- `src/cache/` - Caching system ⏳
- `src/config/` - Configuration management ⏳
- `src/ui/` - User interface components ⏳
- `src/utils/` - Utility functions ⏳
- `package.json` - Updated with CLI binary configuration ⏳

### Architecture Decisions

1. **CLI Framework**: Use a lightweight CLI library compatible with Bun (avoid Node.js-specific libraries)
2. **Database**: Bun's native `bun:sqlite` with Drizzle ORM for type-safe, performant data operations
3. **ORM**: Drizzle ORM for schema management, migrations, and type-safe queries
4. **Prompts**: Interactive CLI prompts with validation using Bun-compatible libraries
5. **Progress Indicators**: cli-progress for visual feedback during long operations
6. **Caching**: File-based caching with TTL support using Bun's file system APIs
7. **Error Handling**: Centralized error handling with user-friendly messages
8. **Configuration**: JSON-based config files in user home directory using Bun's built-in JSON support

### Bun-Specific Implementation Notes

- **Database**: Use `import { Database } from "bun:sqlite"` with Drizzle ORM wrapper
- **ORM**: Drizzle ORM provides type safety, migrations, and optimized queries for Bun SQLite
- **WAL Mode**: Enable Write-Ahead Logging for better concurrent performance
- **File Operations**: Use Bun's built-in `Bun.file()` and `Bun.write()` when possible
- **Process Management**: Use `Bun.$` for shell commands instead of external process libraries
- **Environment**: Leverage Bun's automatic .env loading (no dotenv needed)
- **CLI Libraries**: Choose libraries that work with Bun's runtime (test compatibility first)
- **Progress Bars**: Use cli-progress for visual feedback during scraping and processing

### Development Workflow

1. Start with Phase 1 (CLI Foundation) - essential for all other features
2. Implement Phase 2 (Interactive Prompts) - core user experience
3. Build Phase 3 (Enhanced Scraping) - improved functionality
4. Add Phase 4 (Performance) - optimization and reliability
5. Polish with Phase 5 (UX) - final user experience improvements

### Testing Strategy

- Unit tests for utility functions and data processing
- Integration tests for CLI commands
- Manual testing for interactive prompts
- Performance testing for large datasets
