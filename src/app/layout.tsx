import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";

// We use Inter to match the clean, premium logistics feel
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "KiliRide | Premium Car Hire Kilifi",
  description: "Verified premium car rentals for your coastal adventure in Kilifi.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      {/* 1. 'font-sans' applies your Inter font globally.
          2. 'bg-background' and 'text-foreground' use your new Emerald/Slate variables.
          3. 'flex flex-col' ensures the footer stays at the bottom on short pages.
      */}
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground flex flex-col min-h-screen`}>
        {/* Global Navigation */}
        <Navbar />
        
        {/* Main content area: 
            'flex-grow' expands to fill space, pushing Footer to the bottom.
        */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Global Footer with Kilifi contact info */}
        <Footer />
      </body>
    </html>
  );
}