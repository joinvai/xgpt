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

3. Set up environment variables:
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

### 1. Scrape Tweets

Extract tweets from any user:

```bash
bun run scrape.ts <username>
```

Example:
```bash
bun run scrape.ts elonmusk
```

This will:
- Scrape up to 10,000 tweets from the specified user
- Filter out retweets and replies
- Save tweets to `tweets.json`

### 2. Generate Embeddings

Convert tweets to vector embeddings for semantic search:

```bash
bun run src/embed.ts
```

This will:
- Read tweets from `tweets.json`
- Generate embeddings using OpenAI's `text-embedding-3-small` model
- Save vectors to `vectors.json`

### 3. Ask Questions

Query the tweets using natural language:

```bash
bun run src/ask.ts "What does this person think about AI?"
```

Example queries:
- `"What are their thoughts on programming?"`
- `"Any mentions of startups or entrepreneurship?"`
- `"What projects are they working on?"`

The system will:
- Find the 5 most relevant tweets using semantic search
- Generate a contextual answer using GPT-4o-mini
- Respond in the style of the original user

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

We're working on transforming X-GPT into a powerful CLI tool called `twtgpt`. Here's what's coming:

### 🎯 Planned Features

#### Interactive CLI Interface
```bash
twtgpt <username>
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