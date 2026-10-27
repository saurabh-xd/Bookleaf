import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { ToasterClient } from "../components/common/ToasterClient";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BookLeaf Publishing — Author Support & Communication Portal",
  description:
    "Real-time communication, intelligent AI triage, and transparency portal for BookLeaf authors and operations teams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased">
        <AuthProvider>
          {children}
          <ToasterClient />
        </AuthProvider>
      </body>
    </html>
  );
}
