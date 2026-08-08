import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AI Image Generator",
  description:
    "Generate stunning AI images from text prompts with a modern, provider-independent platform.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "AI Image Generator",
    description: "Generate stunning AI images from text prompts.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="min-h-screen bg-background text-foreground">
          <header className="border-b border-border">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                AI Image Generator
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link
                  href="/"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Generate
                </Link>
                <Link
                  href="/history"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  History
                </Link>
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
