import type { Metadata } from "next";
import { JetBrains_Mono, Inter, Orbitron } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-display",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-accent",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || "https://typeforge.app"),
  title: "TypeForge | AI-Powered Typing Game",
  description:
    "Master your typing with an immersive, competitive, AI-powered typing game. Real-time combo system, particle effects, AI-generated passages, and personalized coaching.",
  keywords: ["typing game", "typing practice", "WPM", "typing speed", "AI typing", "typing test"],
  authors: [{ name: "TypeForge" }],
  openGraph: {
    title: "TypeForge | AI-Powered Typing Game",
    description: "Forge your typing skills in the fires of competition. AI-powered passages, real-time combos, and immersive effects.",
    siteName: "TypeForge",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TypeForge | AI-Powered Typing Game",
    description: "Forge your typing skills in the fires of competition.",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${orbitron.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
