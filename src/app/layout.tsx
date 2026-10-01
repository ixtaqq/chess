import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chess Club — A good day for a game",
  description: "Take your time. Play a friend or the computer with Chess Club, a quiet place for your next game of chess.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
