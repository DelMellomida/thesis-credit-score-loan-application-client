import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BESTLOAN SYSTEM KIT",
  description: "PRE - EVALUATION TASK FOR BESTLOAN SYSTEM",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the nonce from the request headers (set by middleware)
  // This is the official Next.js mechanism for passing the nonce to the <html> tag
  // Note: headers() is async in Next.js 13+, so this component must be async
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') || '';

  // Import AuthProvider and wrap children
  // Import here to avoid SSR issues
  const AuthProvider = require('../context/AuthContext').AuthProvider;
  const { Toaster } = require('../components/ui/sonner');
  
  return (
    <html lang="en" nonce={nonce}>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
