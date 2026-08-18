import type { Metadata } from "next";
import { Special_Elite, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const typewriter = Special_Elite({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const serif = Source_Serif_4({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Security Labs",
  description: "Hands-on AI security labs. Prompt injection, jailbreaks, and more.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${typewriter.variable} ${serif.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
