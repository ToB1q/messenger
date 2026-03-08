'use client'

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MobileNavigation from "./components/layout/MobileNavigation";
import { usePathname } from 'next/navigation';
import { ThemeProvider } from './context/ThemeContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Не показываем нижнюю навигацию на странице авторизации
  if (pathname === '/auth') {
    return (
      <html lang="ru">
        <body>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="ru">
      <body>
        <ThemeProvider>
          {children}
          <MobileNavigation />
        </ThemeProvider>
      </body>
    </html>
  );
}
