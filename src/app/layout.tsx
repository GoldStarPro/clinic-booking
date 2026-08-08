import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from '@/components/ThemeProvider';
import { HydrationGate } from '@/components/HydrationGate';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clinic Booking System",
  description: "Book your medical appointments online",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <HydrationGate>
            <main className="min-h-screen" suppressHydrationWarning>
              {children}
            </main>
          </HydrationGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
