import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
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
  title: "Badar Natural Foods — Kiryana & Daily Kitchen Essentials",
  description:
    "Badar Natural Foods — kiryana and daily kitchen staples: atta, chawal, ghee, oil, masaley and honey. Retail and wholesale. Message us on WhatsApp.",
  applicationName: "Badar Natural Foods",
  icons: {
    icon: { url: "/Logo.jpeg", type: "image/jpeg" },
    shortcut: "/Logo.jpeg",
    apple: "/Logo.jpeg",
  },
};

export const viewport: Viewport = {
  themeColor: "#2b1a10",
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
