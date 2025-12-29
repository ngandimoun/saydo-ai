import type { Metadata, Viewport } from "next";
import { Outfit, Plus_Jakarta_Sans, Playfair_Display, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { GSAPProvider } from "@/lib/gsap-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

// Display font - Modern, friendly headlines
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Body font - Warm, approachable text
const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Accent font for special headlines
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

// Mono font for data/code
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0D9488",
};

export const metadata: Metadata = {
  title: "Saydo - The first AI that knows your mind and your body",
  description: "Voice notes become tasks. Lab results become daily guides. Saydo is the first AI that understands your whole life - work and wellness together.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Saydo",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      </head>
      <body
        className={`${outfit.variable} ${jakartaSans.variable} ${playfair.variable} ${geistMono.variable} antialiased font-body`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <GSAPProvider>
              {children}
            </GSAPProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
