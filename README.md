# Article Analyzer (DeepSeek Powered)

A Cloudflare Workers application that analyzes articles from WeChat Official Accounts, Xiaohongshu, and other platforms using DeepSeek AI.

## Features

- **Frontend**: Responsive web interface for URL submission and result display.
- **Backend**: 
  - URL validation and content fetching.
  - Integration with DeepSeek API for content analysis.
  - Keyword extraction, summary generation, and stats estimation.
- **Security**: Rate limiting and input validation.
- **Deployment**: Automated CI/CD via GitHub Actions to Cloudflare Workers.

## Prerequisites

- Node.js (v20+)
- Cloudflare Account
- DeepSeek API Key

## Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Secrets**
   Create a `.dev.vars` file for local development (optional, or use wrangler secrets for remote):
   ```
   DEEPSEEK_API_KEY=your_local_key_here
   ```

3. **Run Locally**
   ```bash
   npm start
   ```
   Visit `http://localhost:8787` to see the app.

4. **Run Tests**
   ```bash
   npm test
   ```

## Deployment

### Manual Deployment

```bash
npx wrangler login
npx wrangler secret put DEEPSEEK_API_KEY # Enter your key
npm run deploy
```

### CI/CD (GitHub Actions)

1. Push this repository to GitHub.
2. Go to repository **Settings** > **Secrets and variables** > **Actions**.
3. Add the following repository secrets:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API Token (Template: Edit Cloudflare Workers).
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID.
   - `DEEPSEEK_API_KEY`: Your DeepSeek API Key (Optional, if you want to set it via CI, otherwise set it manually in Cloudflare Dashboard).
     *Note: It's better to set `DEEPSEEK_API_KEY` once via `wrangler secret put` or dashboard, as `wrangler.toml` doesn't hold secrets.*

The workflow in `.github/workflows/deploy.yml` will automatically deploy on push to `main`.

## API Documentation

### POST `/api/analyze`

**Request Headers:**
- `Content-Type: application/json`

**Request Body:**
```json
{
  "url": "https://mp.weixin.qq.com/s/..."
}
```

**Response (Success - 200):**
```json
{
  "summary": "This article discusses...",
  "keywords": ["keyword1", "keyword2", ...],
  "stats": {
    "views": "100k+",
    "comments": "Unknown"
  }
}
```

**Response (Error):**
```json
{
  "error": "Error message description"
}
```

## Architecture

- **Platform**: Cloudflare Workers
- **Framework**: Hono
- **AI**: DeepSeek (via OpenAI SDK)
- **Parser**: Cheerio
