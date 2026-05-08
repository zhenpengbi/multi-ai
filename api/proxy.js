// Vercel Serverless Function: OpenRouter proxy
// Allows users in China to access OpenRouter API through Vercel's edge network

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Only allow POST
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, HTTP-Referer, X-Title',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.text();
    const headers = new Headers();
    
    // Forward relevant headers
    const authHeader = req.headers.get('Authorization');
    if (authHeader) headers.set('Authorization', authHeader);
    
    const referer = req.headers.get('HTTP-Referer') || req.headers.get('Referer');
    if (referer) headers.set('HTTP-Referer', referer);
    
    const title = req.headers.get('X-Title');
    if (title) headers.set('X-Title', title);
    
    headers.set('Content-Type', 'application/json');

    // Forward to OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers,
      body,
    });

    // Stream the response back
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
