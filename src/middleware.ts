import { NextRequest, NextResponse } from 'next/server';

/**
 * Authoritative Content Security Policy Implementation for Next.js
 * 
 * This middleware implements a production-grade security solution:
 * 1. Generates a unique cryptographic nonce for each request
 * 2. Sets the nonce on request headers for the server-side renderer
 * 3. Sets the nonce in the CSP header for browser enforcement
 * 4. Applies comprehensive security headers across all routes
 * 
 * This is the official, production-ready approach recommended by Next.js.
 */
export function middleware(request: NextRequest) {
  // Step 1: Generate a unique nonce for this request
  // Using crypto.randomUUID() for maximum entropy, then Base64 encoding
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // Step 2: Create the Content Security Policy header
  // This policy uses the nonce for script protection and 'unsafe-inline' for style compatibility
  const cspHeader = [
    "default-src 'self'",
    // IMPORTANT: 'unsafe-eval' is needed for Next.js Fast Refresh in development.
    // 'strict-dynamic' allows trusted scripts (with a nonce) to load other scripts.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${
      process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''
    }`.trim(),
    // 'unsafe-inline' is a pragmatic choice for style-src to support modern UI libraries.
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
    // font-src: Allow Google Fonts CDN
    "font-src 'self' fonts.gstatic.com",
  // Allow images from same origin, data URIs, and the Supabase storage domain used by the backend
  // (signed URLs are served from this domain). Replace or extend this with your own storage host
  // if you change Supabase project or use a CDN.
  // Allow blob: because the UI displays temporary object URLs created with URL.createObjectURL(file)
  // Also keep data: and the Supabase storage host for signed URLs
  "img-src 'self' data: blob: https://kuvyxmfigayggzqflfjt.supabase.co",
    // connect-src: Allow API connections to same origin and backend API servers
    // - 'self': Same origin (frontend)
    // - http://localhost:9003: Backend API server (development)
    // - http://localhost:8000: Alternative backend port (development)
    // - https://thesis-credit-score-loan-application-6haa.onrender.com: Production backend
  // Allow both http and https local backend ports (some dev setups use HTTPS)
  "connect-src 'self' http://localhost:9003 https://localhost:9003 http://localhost:8000 https://thesis-credit-score-loan-application-6haa.onrender.com",
    // frame-ancestors: Prevent clickjacking (modern method)
    "frame-ancestors 'self'",
    // form-action: Only allow form submissions to same origin
    "form-action 'self'",
    // base-uri: Restrict base tag to same origin
    "base-uri 'self'",
    // Only add upgrade-insecure-requests in production.
    process.env.NODE_ENV === 'production' ? "upgrade-insecure-requests" : ""
  ]
  // CORRECTED: Filter out empty strings to prevent double semicolons in the final header.
  .filter(Boolean)
  .join('; ');

  // Step 3: Clone the request headers and set the nonce
  // This allows the Next.js rendering engine to read the nonce via headers().get('x-nonce')
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  // Step 4: Create the response with modified request headers
  // This passes the nonce through the entire Next.js rendering chain
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Step 5: Set all security headers on the response for the browser
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  return response;
}

// Configure which routes this middleware should run on
export const config = {
  // CORRECTED: A more robust matcher to ensure headers are applied everywhere
  // except for Next.js's internal static assets and prefetch requests.
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
