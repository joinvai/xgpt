# X-GPT 🐦🤖

An AI-powered Twitter/X scraping and question-answering tool that lets you scrape tweets from any user and ask intelligent questions about their content using semantic search and OpenAI's GPT models.

## ✨ Features

- **Tweet Scraping**: Extract tweets from any public X/Twitter user
- **AI-Powered Embeddings**: Convert tweets to vector embeddings for semantic search
- **Intelligent Q&A**: Ask questions about scraped tweets and get contextual answers
- **Semantic Search**: Find relevant tweets using cosine similarity matching
- **Duplicate Prevention**: Automatically filters out retweets and duplicate content

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) runtime
- OpenAI API key
- X/Twitter account with valid session cookies

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd x-gpt
```

2. Install dependencies:
```bash
bun install
```

3. Install globally (optional):
```bash
bun link
```

After linking, you can use `xgpt` from anywhere:
```bash
xgpt --help
xgpt interactive
```

4. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
# OpenAI API Key
OPENAI_KEY=your_openai_api_key_here

# X/Twitter Session Cookies (see setup guide below)
AUTH_TOKEN=your_auth_token_here
CT0=your_ct0_csrf_token_here
```

## 🍪 Cookie Setup

To scrape tweets, you need to extract session cookies from your X/Twitter account:

![Cookie Setup Guide](.github/assets/cookies.png)

### How to get your cookies:

1. **Login to X/Twitter** in your browser
2. **Open Developer Tools** (F12 or right-click → Inspect)
3. **Go to Application/Storage tab** → Cookies → https://x.com
4. **Find these two cookies:**
   - `auth_token` - Your authentication token
   - `ct0` - CSRF token for API requests
5. **Copy the values** and add them to your `.env` file

⚠️ **Important**: Keep your cookies secure and never share them publicly!

## 📖 Usage

### 🌟 Interactive Mode (Recommended)

The easiest way to get started is with interactive mode:

```bash
# Start interactive mode
xgpt interactive

# Or with a specific user
xgpt interactive elonmusk
```

The interactive mode guides you through:

1. **👤 User Selection** - Enter Twitter username
2. **🎯 Content Type** - Choose tweets, replies, or both
3. **🔍 Search Scope** - All posts or keyword filtering
4. **📅 Time Range** - Week, month, 3mo, 6mo, year, lifetime, or custom
5. **⚙️ Options** - Max tweets, embeddings
6. **📋 Summary** - Review configuration
7. **🚀 Execution** - Automated scraping and processing

### 🛠 Direct Commands

For advanced users, you can use direct commands:

```bash
# Scrape tweets with options
xgpt scrape elonmusk --max 1000 --replies --retweets

# Generate embeddings
xgpt embed --model text-embedding-3-small --batch 500

# Ask questions
xgpt ask "What does this person think about AI?" --top 10
```

### 📊 Smart Filtering Features

- **Content filtering**: Replies, retweets, original tweets
- **Keyword matching**: Case-insensitive, partial matching
- **Date filtering**: Efficient time-based filtering
- **Duplicate detection**: Prevents duplicate tweets
- **Progress indicators**: Clear feedback during operations

### 🎯 Example Queries

```bash
xgpt ask "What are their thoughts on programming?"
xgpt ask "Any mentions of startups or entrepreneurship?"
xgpt ask "What projects are they working on?"
xgpt ask "What technologies does this person use?"
```

The system will:
- Find the most relevant tweets using semantic search
- Generate a contextual answer using GPT-4o-mini
- Show similarity scores and source tweets

## 🛠️ Project Structure

```
x-gpt/
├── scrape.ts           # Tweet scraping script
├── src/
│   ├── embed.ts        # Generate tweet embeddings
│   ├── ask.ts          # Question answering system
│   └── index.ts        # Main entry point
├── tweets.json         # Scraped tweets (generated)
├── vectors.json        # Tweet embeddings (generated)
├── cookies.png         # Cookie setup guide
└── README.md           # This file
```

## 🗺️ Roadmap

We're working on transforming X-GPT into a powerful CLI tool called `xgpt`. Here's what's coming:

### 🎯 Planned Features

#### Interactive CLI Interface
```bash
xgpt interactive <username>
```

The CLI will guide you through an interactive setup:

1. **Content Type Selection**
   - Tweets only
   - Replies only
   - Both tweets and replies

2. **Search Scope**
   - All posts from the user
   - Keyword-filtered posts
   - Example keywords: `"AI, chatgpt, programming"` (comma-separated)

3. **Time Range Filtering**
   - Last week
   - Last month
   - Last 3 months
   - Last 6 months
   - Last year
   - Lifetime (all available tweets)

4. **Advanced Features**
   - Duplicate detection and removal
   - Real-time progress indicators
   - Configurable output formats
   - Batch processing for multiple users

### 🔧 Technical Improvements

- [ ] **CLI Framework**: Implement interactive prompts with validation
- [ ] **Database Integration**: Replace JSON files with SQLite for better performance
- [ ] **Caching System**: Smart caching to avoid re-scraping recent tweets
- [ ] **Rate Limiting**: Intelligent rate limiting to respect X/Twitter API limits
- [ ] **Error Handling**: Robust error handling and recovery mechanisms
- [ ] **Configuration**: User-friendly config file for default settings
- [ ] **Export Options**: Multiple output formats (JSON, CSV, Markdown)

### 🎨 User Experience

- [ ] **Progress Bars**: Visual feedback during scraping and embedding
- [ ] **Smart Defaults**: Remember user preferences between sessions
- [ ] **Help System**: Built-in help and examples for all commands
- [ ] **Validation**: Input validation with helpful error messages
- [ ] **Logging**: Detailed logging for debugging and monitoring

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This tool is for educational and research purposes only. Please respect X/Twitter's Terms of Service and rate limits. Use responsibly and ensure you have permission to scrape the content you're accessing.

---

**Built with ❤️ using [Bun](https://bun.sh/), [OpenAI](https://openai.com/), and [@the-convocation/twitter-scraper](https://github.com/the-convocation/twitter-scraper)**