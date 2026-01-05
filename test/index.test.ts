import { describe, it, expect, vi } from 'vitest';
import app from '../src/index';

describe('Article Analyzer API', () => {
  it('GET / should return HTML', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('<!DOCTYPE html>');
    expect(text).toContain('文章深度分析器');
  });

  it('POST /api/analyze should validate URL', async () => {
    const res = await app.request('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ url: 'not-a-url' }),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data).toEqual({ error: 'Invalid URL provided' });
  });

  // Note: We are not mocking fetch/OpenAI here for simplicity in this file generation,
  // but in a real scenario we would mock global.fetch and the OpenAI client.
  // This test ensures the routing and validation logic works.
});
