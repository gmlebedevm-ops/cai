import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { MainLayout } from "@/components/layout/main-layout";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Contract.Ai - Управление договорами",
  description: "Интеллектуальная система управления договорами с автоматизацией согласования и анализа",
  keywords: ["Contract.Ai", "управление договорами", "согласование", "автоматизация", "искусственный интеллект", "Next.js", "TypeScript"],
  authors: [{ name: "Contract.Ai Team" }],
  openGraph: {
    title: "Contract.Ai",
    description: "Управление договорами",
    url: "https://contractai.local",
    siteName: "Contract.Ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contract.Ai",
    description: "Управление договорами",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <MainLayout>
              {children}
            </MainLayout>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
