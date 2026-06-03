import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: {
    default: "MyLegalPrompt — Understand Any Legal Document in Plain English",
    template: "%s · MyLegalPrompt",
  },
  description:
    "Upload any contract or legal document and instantly get a plain-English explanation, risk score, key clauses, deadlines, and red flags.",
  keywords: [
    "legal document analysis",
    "contract review",
    "plain english legal",
    "AI contract analyzer",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${mono.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
