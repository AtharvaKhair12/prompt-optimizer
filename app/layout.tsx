import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nexora Optimize — AI-Powered Prompt Engineering",
  description:
    "Transform your raw prompts into well-structured, optimized prompts for better LLM results. Uses heuristic analysis, semantic scoring, and Gemini AI rewriting. Free, private, bring-your-own-key.",
  keywords: [
    "prompt engineering",
    "prompt optimizer",
    "AI prompt",
    "LLM",
    "Gemini",
    "ChatGPT",
    "prompt improvement",
  ],
  openGraph: {
    title: "Nexora Optimize — AI-Powered Prompt Engineering",
    description:
      "Transform your raw prompts into well-structured, optimized prompts for better LLM results.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} dark h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#1a1030" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
