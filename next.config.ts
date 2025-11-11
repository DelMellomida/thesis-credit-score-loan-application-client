import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable the 'X-Powered-By: Next.js' header for security hardening
  // This prevents information disclosure about the framework in use
  poweredByHeader: false,
  
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
};

// Allow Next.js Image component to load remote images from the Supabase storage domain
// This is required if the app uses next/image to render signed Supabase URLs.
nextConfig.images = {
  domains: ["kuvyxmfigayggzqflfjt.supabase.co"],
  // During development we keep the default loader; set `unoptimized: true` if you
  // experience issues with Next.js image optimization in your environment.
};

export default nextConfig;
