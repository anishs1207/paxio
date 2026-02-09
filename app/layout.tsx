import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/common/NavBar";
import Footer from "@/components/common/Footer";
import { Toaster } from "@/components/ui/sonner";
import { SessionProviders } from "./SessionProvider";

// @@later: theme mode 
// <ThemeProvider
//           attribute="class"
//           defaultTheme="system"
//           enableSystem
//           disableTransitionOnChange
//         ></ThemeProvider>

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Paxio - Your AI Crew",
  description: "Paxio: Boost productivity, eliminate manual work, and scale faster — powered by cutting-edge AI automation.",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProviders>

          <Toaster />
          {children}

        </SessionProviders>
      </body>
    </html>
  );
}
