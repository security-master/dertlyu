import type { Metadata } from "next";
import { Figtree, Syne } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const display = Syne({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Dertlyu — AI Image Generator",
    template: "%s · Dertlyu",
  },
  description:
    "Generate images from text with a provider-independent AI platform. Pollinations and Hugging Face behind one API.",
  openGraph: {
    title: "Dertlyu — AI Image Generator",
    description:
      "Describe an image, choose settings, and generate. Persistent history and downloadable results.",
    type: "website",
    siteName: "Dertlyu",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
