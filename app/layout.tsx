import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PromptOptimizer — AI-Powered Prompt Engineering",
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
    title: "PromptOptimizer — AI-Powered Prompt Engineering",
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
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
