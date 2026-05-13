import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ConditionalHeader from "./components/ConditionalHeader";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  title: "Crucidex",
  description:
    "Track your gaming history, share reviews, follow friends, and discover new games.",
  applicationName: "Crucidex",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Crucidex",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    title: "Crucidex",
    description:
      "Track your gaming history, share reviews, follow friends, and discover new games.",
    siteName: "Crucidex",
  },
  icons: {
    icon: [
      { url: "/icon.svg", media: "(prefers-color-scheme: light)", type: "image/svg+xml" },
      { url: "/icon-dark.svg", media: "(prefers-color-scheme: dark)", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.png", media: "(prefers-color-scheme: light)" },
      { url: "/apple-icon-dark.png", media: "(prefers-color-scheme: dark)" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-title" content="Crucidex" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={inter.className}>
        <ConditionalHeader />
        {children}
      </body>
    </html>
  );
}
