import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { html } from './html';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';

type Bindings = {
  DEEPSEEK_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

// Serve Frontend
app.get('/', (c) => c.html(html));

// Favicon to prevent 404
app.get('/favicon.ico', (c) => c.text('', 204));

// Rate Limiting (Simple In-Memory per Isolate)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;

app.use('/api/*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  const lastReq = rateLimitMap.get(ip) || 0;
  
  if (now - lastReq < 2000) {
      return c.json({ error: 'Too many requests. Please wait.' }, 429);
  }
  rateLimitMap.set(ip, now);
  
  await next();
});

// Analyze Endpoint
app.post('/api/analyze', async (c) => {
  try {
    const { url } = await c.req.json<{ url: string }>();

    // 1. Input Validation
    if (!url || !isValidUrl(url)) {
      return c.json({ error: 'Invalid URL provided' }, 400);
    }

    // 2. Fetch Content
    const content = await fetchArticleContent(url);
    if (!content) {
        return c.json({ error: 'Failed to fetch article content' }, 422);
    }

    // 3. DeepSeek Analysis
    const apiKey = c.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
        return c.json({ error: 'Server configuration error: API Key missing' }, 500);
    }

    const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: 'https://api.deepseek.com',
    });

    // Smart Truncation: Keep start (intro) and end (footer/stats)
    let processedContent = content;
    if (content.length > 12000) {
        processedContent = content.substring(0, 6000) + "\n...[Content Truncated]...\n" + content.substring(content.length - 6000);
    }

    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: "system", 
                content: `You are an expert article analyzer. 
                Analyze the provided article content and return a JSON object with:
                - summary: A concise summary (max 100 words).
                - keywords: An array of 10 representative keywords.
                - stats: An object with 'views' and 'comments' fields. 
                  * Look for keywords like "阅读" (Read), "浏览" (View), "评论" (Comment), "点赞" (Like).
                  * If explicit numbers are found (e.g., "阅读 10万+", "Read 100k"), extract them.
                  * Note that for some platforms (like WeChat), exact counts might be hidden dynamically. If you see static placeholders or cannot find any numbers, strictly set them to "N/A".
                Reply ONLY with the JSON.`
            },
            { role: "user", content: processedContent }
        ],
        model: "deepseek-chat",
        response_format: { type: "json_object" },
    });

    const result = completion.choices[0].message.content;
    if (!result) throw new Error("Empty response from AI");

    const analysis = JSON.parse(result);

    return c.json(analysis);

  } catch (err: any) {
    console.error('Analysis Error:', err);
    return c.json({ error: err.message || 'Internal Server Error' }, 500);
  }
});

function isValidUrl(urlString: string): boolean {
    try {
        new URL(urlString);
        return true;
    } catch {
        return false;
    }
}

async function fetchArticleContent(url: string): Promise<string> {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts and styles
    $('script').remove();
    $('style').remove();
    $('noscript').remove();

    // Specific Platform Optimizations
    if (url.includes('mp.weixin.qq.com')) {
        // WeChat: Try to get the full container which includes footer
        // #img-content is the main wrapper usually
        const mainContent = $('#img-content').text().trim();
        if (mainContent) return mainContent.replace(/\s+/g, ' ');
        
        // Fallback to body but try to clean up navigation noise if possible
        // But for now, body is safer than just #js_content
        return $('body').text().trim().replace(/\s+/g, ' ');
    }
    
    // Generic
    return $('body').text().trim().replace(/\s+/g, ' ');
}

export default app;
